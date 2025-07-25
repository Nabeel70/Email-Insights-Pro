
'use server';

import type { Campaign, CampaignStats, EmailList, Subscriber } from './types';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { admin } from '@/lib/firebaseAdmin';
import { ApiError, NetworkError, UnexpectedResponseError } from './errors';

// ============================================================================
// 1. CONFIGURATION & CONSTANTS
// ============================================================================
const API_BASE_URL = 'https://app.epmailpro.com/api/index.php';
const API_KEY = process.env.EPMAILPRO_PUBLIC_KEY;


// ============================================================================
// 2. CORE INFRASTRUCTURE (URL BUILDER & GENERIC API CALL)
// ============================================================================
function buildApiUrl(path: string, params?: Record<string, string | number>): URL {
  const robustBase = API_BASE_URL.endsWith('/')? API_BASE_URL : `${API_BASE_URL}/`;
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  const url = new URL(cleanPath, robustBase);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
  }
  return url;
}


async function apiCall<TSuccessResponse>(
  url: URL,
  options: RequestInit = {}
): Promise<TSuccessResponse> {
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-EP-API-KEY': API_KEY || '',
  };

  const config: RequestInit = {
   ...options,
    headers: {
     ...defaultHeaders,
     ...options.headers,
    },
    cache: 'no-store',
  };

  if (!API_KEY) {
    throw new Error('Missing EPMAILPRO_PUBLIC_KEY. Check your .env file and App Hosting backend configuration.');
  }

  let response: Response;
  try {
    response = await fetch(url.href, config);
  } catch (error) {
    if (error instanceof TypeError) { // fetch throws TypeError for network errors
      throw new NetworkError(error);
    }
    throw error; // Re-throw other unexpected errors
  }

  if (!response.ok) {
    throw new ApiError(`API request failed with status ${response.status}`, response);
  }

  const contentType = response.headers.get('content-type');
  if (!contentType ||!contentType.includes('application/json')) {
    const responseText = await response.text();
     if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
        throw new UnexpectedResponseError(`Expected JSON but received HTML. Raw: ${responseText.slice(0, 200)}...`, 'text/html');
    }
    throw new UnexpectedResponseError(`Expected JSON response, but received ${contentType || 'no content type'}`, contentType);
  }

  const responseText = await response.text();
  if (!responseText) {
    return null as TSuccessResponse;
  }
  
  try {
    const result = JSON.parse(responseText);
     if (result.status && result.status !== 'success') {
          throw new ApiError(`API returned a failure status: ${JSON.stringify(result.error || result)}`, response);
      }
      return (result.data?.records || result.data?.record || result.data || result) as TSuccessResponse;
  } catch (e) {
      if (responseText === "[]") {
        return [] as TSuccessResponse;
      }
      throw new UnexpectedResponseError(`Invalid JSON response from API. Raw text: ${responseText}`, contentType);
  }
}


export async function makeApiRequest(
  method: 'GET' | 'POST' | 'PUT',
  endpoint: string,
  params: Record<string, any> = {},
  body: Record<string, any> | null = null
) {
    const url = buildApiUrl(endpoint, method === 'GET' ? params : undefined);

    const options: RequestInit = { method };
    if (method !== 'GET' && body) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(body);
    }
    
    try {
        const data = await apiCall(url, options);
        return { data, requestInfo: { url: url.href, method, headers: options.headers, body: options.body } };
    } catch(error) {
        console.error("Error in makeApiRequest compatibility wrapper:", error);
        throw error;
    }
}


async function getCampaign(campaignUid: string): Promise<Campaign | null> {
    const data = await apiCall<Campaign>(buildApiUrl(`campaigns/${campaignUid}`));
    return data;
}

async function getCampaignsForSync(): Promise<Campaign[]> {
    console.log("SYNC_STEP: Fetching campaign summaries...");
    const summaryData = await apiCall<Campaign[]>(buildApiUrl('campaigns', { page: '1', per_page: '50' }));

    if (!summaryData || summaryData.length === 0) {
        console.log("SYNC_STEP: No summary campaigns found.");
        return [];
    }
    console.log(`SYNC_STEP: Found ${summaryData.length} summary campaigns. Fetching details...`);

    const detailedCampaignsPromises = summaryData.map(async (c: { campaign_uid: string }) => {
        try {
            return await getCampaign(c.campaign_uid);
        } catch (error) {
            console.error(`Could not fetch details for campaign ${c.campaign_uid}, skipping. Reason:`, (error as Error).message);
            return null; // Return null on error to filter out later
        }
    });
    const detailedCampaignsResults = await Promise.all(detailedCampaignsPromises);

    const successfullyFetchedCampaigns = detailedCampaignsResults.filter(c => c !== null) as Campaign[];
        
    const filteredCampaigns = successfullyFetchedCampaigns.filter(campaign => {
        if (!campaign || !campaign.name) return false;
        const lowerCaseName = campaign.name.toLowerCase();
        return !lowerCaseName.includes('farm') && !lowerCaseName.includes('test');
    });

    console.log(`SYNC_STEP: Successfully fetched and filtered ${filteredCampaigns.length} campaigns.`);
    return filteredCampaigns;
}

export async function getCampaignStats(campaignUid: string): Promise<CampaignStats | null> {
    const data = await apiCall<CampaignStats | null>(buildApiUrl(`campaigns/${campaignUid}/stats`));
    if (!data) return null;
    return { ...data, campaign_uid: campaignUid };
}

async function getUnsubscribedSubscribersForSync(listUid: string): Promise<Subscriber[]> {
    return await apiCall<Subscriber[]>(buildApiUrl(`lists/${listUid}/subscribers`, {
        page: '1',
        per_page: '10000',
        status: 'unsubscribed'
    }));
}

async function getListsForSync(): Promise<EmailList[]> {
    console.log("SYNC_STEP: Fetching lists...");
    const allLists = await apiCall<EmailList[]>(buildApiUrl('lists'));
    
    if (!allLists) return [];

    const filteredLists = allLists.filter((list: EmailList) => {
        if (!list || !list.general?.name) return false;
        const lowerCaseName = list.general.name.toLowerCase();
        return !lowerCaseName.includes('farm') && !lowerCaseName.includes('test');
    });
    console.log(`SYNC_STEP: Found and filtered ${filteredLists.length} lists.`);
    return filteredLists;
}

async function storeRawData(collectionName: string, data: any[], idKey: string) {
    if (data.length === 0) return;
    console.log(`SYNC_STEP: Storing ${data.length} raw items in Firestore collection '${collectionName}'...`);
    const adminDb = getAdminFirestore(admin.app());
    const batch = adminDb.batch();
    const collectionRef = adminDb.collection(collectionName);
    data.forEach(item => {
      if(item && item[idKey]) {
          const docRef = collectionRef.doc(item[idKey]);
          batch.set(docRef, item, { merge: true });
      }
    });
    await batch.commit();
    console.log(`SYNC_STEP: Stored items in '${collectionName}'.`);
}


export async function syncAllData() {
    console.log("Starting full data sync...");

    const campaigns = await getCampaignsForSync();
    let successfulStats: CampaignStats[] = [];
    if (campaigns.length > 0) {
        const statsPromises = campaigns.map(async c => {
            try {
                return await getCampaignStats(c.campaign_uid);
            } catch (error) {
                console.error(`Could not fetch stats for campaign ${c.campaign_uid}, skipping. Reason:`, (error as Error).message);
                return null;
            }
        });
        const statsResults = await Promise.all(statsPromises);
        successfulStats = statsResults.filter(s => s !== null) as CampaignStats[];
    }
    await storeRawData('rawCampaigns', campaigns, 'campaign_uid');
    await storeRawData('rawStats', successfulStats, 'campaign_uid');
    console.log(`Synced ${campaigns.length} campaigns and ${successfulStats.length} stats records.`);

    const lists: EmailList[] = await getListsForSync();
    let uniqueSubscribers: Subscriber[] = [];
    if (lists.length > 0) {
        const unsubscriberPromises = lists.map(async list => {
            try {
                return await getUnsubscribedSubscribersForSync(list.general.list_uid);
            } catch(error) {
                 console.error(`Could not fetch unsubscribers for list ${list.general.list_uid}, skipping. Reason:`, (error as Error).message);
                return []; // Return empty array on error
            }
        });
        const unsubscriberResults = await Promise.all(unsubscriberPromises);
        const allUnsubscribers = unsubscriberResults.flat();

        const uniqueSubscribersMap = new Map<string, Subscriber>();
        allUnsubscribers.forEach(sub => {
            if (sub && sub.subscriber_uid) {
                uniqueSubscribersMap.set(sub.subscriber_uid, sub);
            }
        });
        uniqueSubscribers = Array.from(uniqueSubscribersMap.values());
    }
    await storeRawData('rawLists', lists, 'general.list_uid');
    await storeRawData('rawUnsubscribers', uniqueSubscribers, 'subscriber_uid');
    console.log(`Synced ${lists.length} lists and ${uniqueSubscribers.length} unsubscribers.`);

    const message = `Sync complete. Fetched ${campaigns.length} campaigns, ${successfulStats.length} stats, ${lists.length} lists, and ${uniqueSubscribers.length} unsubscribers.`;
    return { success: true, message };
}

// Kept for daily report generation
export async function getCampaigns(): Promise<Campaign[]> {
    const campaigns = await apiCall<Campaign[]>(buildApiUrl('campaigns', { page: '1', per_page: '50' }));
    if (!campaigns) return [];
    
    return campaigns.filter((c: Campaign) => c.name && !c.name.toLowerCase().includes('farm') && !c.name.toLowerCase().includes('test'));
}
