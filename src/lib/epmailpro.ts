'use server';

import type { Campaign, CampaignStats, EmailList, Subscriber } from './types';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { admin } from '@/lib/firebaseAdmin';
import { ApiError, NetworkError, UnexpectedResponseError } from './errors';

// ============================================================================
// 1. CONFIGURATION & CONSTANTS
// ============================================================================
const API_BASE_URL = 'https://app.epmailpro.com/api';
const API_KEY = process.env.EPMAILPRO_PUBLIC_KEY;


// ============================================================================
// 2. CORE INFRASTRUCTURE (URL BUILDER & GENERIC API CALL)
// ============================================================================
function buildApiUrl(path: string, params?: Record<string, string | number>): URL {
  const robustBase = API_BASE_URL.endsWith('/')? API_BASE_URL : `${API_BASE_URL}/`;
  // Ensure the path always includes index.php
  const fullPath = `index.php/${path.startsWith('/') ? path.substring(1) : path}`;
  const url = new URL(fullPath, robustBase);
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
    'X-MW-PUBLIC-KEY': API_KEY || '', // Correct Header based on user feedback
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
        throw new UnexpectedResponseError(`Expected JSON but received HTML. This often indicates an authentication error or an incorrect API endpoint. Raw: ${responseText.slice(0, 200)}...`, 'text/html');
    }
    throw new UnexpectedResponseError(`Expected JSON response, but received ${contentType || 'no content type'}`, contentType);
  }

  const responseText = await response.text();
  // Handle cases where the API returns an empty body for success (e.g., a 204 No Content)
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
      // Handle cases where the API returns an empty array as the top-level response
      if (responseText === "[]") {
        return [] as TSuccessResponse;
      }
      throw new UnexpectedResponseError(`Invalid JSON response from API. Raw text: ${responseText}`, contentType);
  }
}

// This wrapper remains for the Test API page, but internal calls use apiCall directly
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
    
    // Let errors from apiCall propagate up to the caller of makeApiRequest
    const data = await apiCall(url, options);
    return { data, requestInfo: { url: url.href, method, headers: options.headers, body: options.body } };
}


async function getCampaign(campaignUid: string): Promise<Campaign | null> {
    return apiCall<Campaign>(buildApiUrl(`campaigns/${campaignUid}`));
}

async function getCampaignsForSync(): Promise<Campaign[]> {
    console.log("SYNC_STEP: Fetching campaign summaries...");
    const summaryData = await apiCall<Campaign[]>(buildApiUrl('campaigns', { page: '1', per_page: '50' }));

    if (!summaryData || summaryData.length === 0) {
        console.log("SYNC_STEP: No summary campaigns found.");
        return [];
    }
    console.log(`SYNC_STEP: Found ${summaryData.length} summary campaigns. Fetching details...`);

    const detailedCampaignsPromises = summaryData.map(c => getCampaign(c.campaign_uid));
    const detailedCampaignsResults = await Promise.allSettled(detailedCampaignsPromises);

    const successfullyFetchedCampaigns = detailedCampaignsResults
      .filter((result): result is PromiseFulfilledResult<Campaign | null> => {
          if (result.status === 'rejected') {
              console.error(`Could not fetch details for a campaign, skipping. Reason:`, result.reason);
              return false;
          }
          return result.value !== null;
      })
      .map(result => result.value as Campaign);
        
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
    return apiCall<Subscriber[]>(buildApiUrl(`lists/${listUid}/subscribers`, {
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
    // This function now acts as the main orchestrator with a single error handler
    try {
        console.log("Starting full data sync...");

        const campaigns = await getCampaignsForSync();
        
        let successfulStats: CampaignStats[] = [];
        if (campaigns.length > 0) {
            const statsPromises = campaigns.map(c => getCampaignStats(c.campaign_uid));
            const statsResults = await Promise.allSettled(statsPromises);
            successfulStats = statsResults
              .filter((result): result is PromiseFulfilledResult<CampaignStats | null> => {
                  if (result.status === 'rejected') {
                      console.error(`Could not fetch stats for a campaign, skipping. Reason:`, result.reason);
                      return false;
                  }
                  return result.value !== null;
              })
              .map(result => result.value as CampaignStats);
        }
        
        await storeRawData('rawCampaigns', campaigns, 'campaign_uid');
        await storeRawData('rawStats', successfulStats, 'campaign_uid');
        console.log(`Synced ${campaigns.length} campaigns and ${successfulStats.length} stats records.`);

        const lists = await getListsForSync();
        let uniqueSubscribers: Subscriber[] = [];
        if (lists.length > 0) {
            const unsubscriberPromises = lists.map(list => getUnsubscribedSubscribersForSync(list.general.list_uid));
            const unsubscriberResults = await Promise.allSettled(unsubscriberPromises);
            
            const allUnsubscribers = unsubscriberResults
              .filter((result): result is PromiseFulfilledResult<Subscriber[]> => {
                  if (result.status === 'rejected') {
                      console.error(`Could not fetch unsubscribers for a list, skipping. Reason:`, result.reason);
                      return false;
                  }
                  return true;
              })
              .flatMap(result => result.value);

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

    } catch (error) {
        // Centralized error handling
        console.error("SYNC JOB FAILED:", error);
        throw error; // Re-throw the original error to be handled by the calling route
    }
}

// Kept for daily report generation, relies on the robust apiCall
export async function getCampaigns(): Promise<Campaign[]> {
    const campaigns = await apiCall<Campaign[]>(buildApiUrl('campaigns', { page: '1', per_page: '50' }));
    if (!campaigns) return [];
    
    // Filter out test/farm campaigns
    return campaigns.filter((c: Campaign) => c.name && !c.name.toLowerCase().includes('farm') && !c.name.toLowerCase().includes('test'));
}
