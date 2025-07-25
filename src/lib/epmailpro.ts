
'use server';

import type { Campaign, CampaignStats, EmailList, Subscriber } from './types';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { admin } from '@/lib/firebaseAdmin';

const adminDb = getAdminFirestore(admin.app());

const API_BASE_URL = 'https://app.epmailpro.com/api/index.php';
const API_KEY = process.env.EPMAILPRO_PUBLIC_KEY;

export async function makeApiRequest(
  method: 'GET' | 'POST' | 'PUT',
  endpoint: string,
  params: Record<string, any> = {},
  body: Record<string, any> | null = null
) {
  if (!API_KEY) {
    throw new Error('Missing EPMAILPRO_PUBLIC_KEY. Check your .env file and App Hosting backend configuration.');
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  let urlString = `${API_BASE_URL}/${cleanEndpoint}`;

  const requestInfo = {
    url: urlString,
    method: method,
    headers: { 'X-MW-PUBLIC-KEY': API_KEY } as HeadersInit,
    body: body ? JSON.stringify(body) : null,
  };

  const options: RequestInit = {
    method,
    headers: {
        ...requestInfo.headers,
        'Accept': 'application/json',
    },
    cache: 'no-store',
  };

  if (method === 'GET') {
    const searchParams = new URLSearchParams(
        Object.entries(params).map(([key, value]) => [key, String(value)])
    );
    if (searchParams.toString()) {
      urlString += `?${searchParams.toString()}`;
      requestInfo.url = urlString;
    }
  } else if (body) { 
    if (options.headers) {
        (options.headers as Record<string, string>)['Content-Type'] = 'application/json';
    }
    options.body = requestInfo.body;
  }

  try {
    const response = await fetch(urlString, options);
    const responseText = await response.text();

    if (!response.ok) {
        let errorDetails = `API request failed with status ${response.status} for ${method} ${urlString}.`;
        console.error("Raw API error response:", responseText); // Log raw error
        try {
            const errorJson = JSON.parse(responseText);
            const specificError = errorJson.error || (errorJson.data ? errorJson.data.error : JSON.stringify(errorJson));
            errorDetails += ` Details: ${specificError}`;
        } catch (e) {
            errorDetails += ` Response body: ${responseText}`;
        }
        const error = new Error(errorDetails);
        (error as any).statusCode = response.status;
        (error as any).requestInfo = requestInfo;
        throw error;
    }
    
    if (!responseText) {
      return { data: null, requestInfo };
    }
    
    if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
        const error = new Error(`Expected JSON but received HTML. Raw response: ${responseText.slice(0, 500)}...`);
        (error as any).requestInfo = requestInfo;
        throw error;
    }

    try {
      const result = JSON.parse(responseText);
      
      if (result.status && result.status !== 'success') {
          const error = new Error(`API returned a failure status: ${JSON.stringify(result.error || result)}`);
          (error as any).requestInfo = requestInfo;
          throw error;
      }

      const data = result.data?.records || result.data?.record || result.data || result;
      return { data, requestInfo };

    } catch(e) {
      if (responseText === "[]") {
        return { data: [], requestInfo };
      }
      console.error("Raw API response on JSON parse error:", responseText); // Log raw text on parse error
      const error = new Error(`Invalid JSON response from API. Raw text: ${responseText}`);
      (error as any).requestInfo = requestInfo;
      throw error;
    }

  } catch (e: any) {
    console.error(`Error during API request to ${urlString}. Error: ${e.message}`);
    if(!(e as any).requestInfo) {
      (e as any).requestInfo = requestInfo;
    }
    throw e;
  }
}

async function getCampaign(campaignUid: string): Promise<Campaign | null> {
    try {
        const { data } = await makeApiRequest('GET', `campaigns/${campaignUid}`);
        if (!data) return null;
        return data as Campaign;
    } catch (error) {
        console.error(`Could not fetch details for campaign ${campaignUid}. Reason:`, (error as Error).message);
        return null;
    }
}

async function getCampaignsForSync(): Promise<Campaign[]> {
    console.log("SYNC_STEP: Fetching campaign summaries...");
    const { data: summaryData } = await makeApiRequest('GET', 'campaigns', {
        page: '1',
        per_page: '50'
    });

    const summaryCampaigns = (Array.isArray(summaryData) ? summaryData : summaryData?.records) || [];

    if (summaryCampaigns.length === 0) {
        console.log("SYNC_STEP: No summary campaigns found.");
        return [];
    }
    console.log(`SYNC_STEP: Found ${summaryCampaigns.length} summary campaigns. Fetching details...`);

    const detailedCampaignsPromises = summaryCampaigns.map((c: { campaign_uid: string }) => getCampaign(c.campaign_uid));
    const detailedCampaignsResults = await Promise.allSettled(detailedCampaignsPromises);

    const successfullyFetchedCampaigns = detailedCampaignsResults
        .filter((result): result is PromiseFulfilledResult<Campaign | null> => result.status === 'fulfilled' && result.value !== null)
        .map(result => result.value as Campaign);
        
    const filteredCampaigns = successfullyFetchedCampaigns.filter(campaign => {
        if (!campaign || !campaign.name) return false;
        const lowerCaseName = campaign.name.toLowerCase();
        return !lowerCaseName.includes('farm') && !lowerCaseName.includes('test');
    });

    console.log(`SYNC_STEP: Successfully fetched and filtered ${filteredCampaigns.length} campaigns.`);
    return filteredCampaigns;
}

async function getCampaignStatsForSync(campaignUid: string): Promise<CampaignStats | null> {
  try {
    const { data } = await makeApiRequest('GET', `campaigns/${campaignUid}/stats`);
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return null;
    }
    return { ...data, campaign_uid: campaignUid };
  } catch (error) {
    console.error(`Could not fetch or process stats for campaign ${campaignUid}. Reason:`, (error as Error).message);
    return null;
  }
}

async function getUnsubscribedSubscribersForSync(listUid: string): Promise<Subscriber[]> {
    const { data } = await makeApiRequest('GET', `lists/${listUid}/subscribers`, {
        page: '1',
        per_page: '10000',
        status: 'unsubscribed'
    });
    return (Array.isArray(data) ? data : data?.records) || [];
}

async function getListsForSync(): Promise<EmailList[]> {
    console.log("SYNC_STEP: Fetching lists...");
    const { data } = await makeApiRequest('GET', 'lists');
    const allLists = (Array.isArray(data) ? data : data?.records) || [];
    
    const filteredLists = allLists.filter((list: EmailList) => {
        if (!list || !list.general?.name) return false;
        const lowerCaseName = list.general.name.toLowerCase();
        return !lowerCaseName.includes('farm') && !lowerCaseName.includes('test');
    });
    console.log(`SYNC_STEP: Found and filtered ${filteredLists.length} lists.`);
    return filteredLists;
}

async function storeRawCampaigns(campaigns: Campaign[]) {
    if (campaigns.length === 0) return;
    console.log(`SYNC_STEP: Storing ${campaigns.length} raw campaigns in Firestore...`);
    const batch = adminDb.batch();
    const campaignsCollection = adminDb.collection('rawCampaigns');
    campaigns.forEach(campaign => {
      const docRef = campaignsCollection.doc(campaign.campaign_uid);
      batch.set(docRef, campaign, { merge: true });
    });
    await batch.commit();
    console.log("SYNC_STEP: Stored campaigns.");
}

async function storeRawStats(stats: CampaignStats[]) {
    if (stats.length === 0) return;
    console.log(`SYNC_STEP: Storing ${stats.length} raw stats in Firestore...`);
    const batch = adminDb.batch();
    const statsCollection = adminDb.collection('rawStats');
    stats.forEach(stat => {
        if (stat) {
            const docRef = statsCollection.doc(stat.campaign_uid);
            batch.set(docRef, stat, { merge: true });
        }
    });
    await batch.commit();
    console.log("SYNC_STEP: Stored stats.");
}

async function storeRawLists(lists: EmailList[]) {
    if (lists.length === 0) return;
    console.log(`SYNC_STEP: Storing ${lists.length} raw lists in Firestore...`);
    const batch = adminDb.batch();
    const listsCollection = adminDb.collection('rawLists');
    lists.forEach(list => {
        const docRef = listsCollection.doc(list.general.list_uid);
        batch.set(docRef, list);
    });
    await batch.commit();
    console.log("SYNC_STEP: Stored lists.");
}

async function storeRawUnsubscribes(subscribers: Subscriber[]) {
    if (subscribers.length === 0) return;
    console.log(`SYNC_STEP: Storing ${subscribers.length} raw unsubscribes in Firestore...`);
    const batch = adminDb.batch();
    const unsubscribesCollection = adminDb.collection('rawUnsubscribes');
    subscribers.forEach(sub => {
      if(sub && sub.subscriber_uid) {
          const docRef = unsubscribesCollection.doc(sub.subscriber_uid);
          batch.set(docRef, sub);
      }
    });
    await batch.commit();
    console.log("SYNC_STEP: Stored unsubscribes.");
}

export async function syncAllData() {
    console.log("Starting full data sync...");

    // 1. Fetch and store campaigns and their stats
    const campaigns = await getCampaignsForSync();
    let successfulStats: CampaignStats[] = [];
    if (campaigns.length > 0) {
        const statsPromises = campaigns.map(c => getCampaignStatsForSync(c.campaign_uid));
        const statsResults = await Promise.allSettled(statsPromises);
        successfulStats = statsResults
            .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled' && !!(result.value))
            .map(result => result.value);
    }
    await storeRawCampaigns(campaigns);
    await storeRawStats(successfulStats);
    console.log(`Synced ${campaigns.length} campaigns and ${successfulStats.length} stats records.`);

    // 2. Fetch and store lists and their unsubscribers
    const lists: EmailList[] = await getListsForSync();
    let uniqueSubscribers: Subscriber[] = [];
    if (lists.length > 0) {
        const unsubscriberPromises = lists.map(list => getUnsubscribedSubscribersForSync(list.general.list_uid));
        const unsubscriberResults = await Promise.allSettled(unsubscriberPromises);
        const allUnsubscribers: Subscriber[] = unsubscriberResults
            .filter((result): result is PromiseFulfilledResult<Subscriber[]> => result.status === 'fulfilled' && result.value !== null)
            .flatMap(result => result.value);

        const uniqueSubscribersMap = new Map<string, Subscriber>();
        allUnsubscribers.forEach(sub => {
            if (sub && sub.subscriber_uid) {
                uniqueSubscribersMap.set(sub.subscriber_uid, sub);
            }
        });
        uniqueSubscribers = Array.from(uniqueSubscribersMap.values());
    }
    await storeRawLists(lists);
    await storeRawUnsubscribes(uniqueSubscribers);
    console.log(`Synced ${lists.length} lists and ${uniqueSubscribers.length} unsubscribers.`);

    const message = `Sync complete. Fetched ${campaigns.length} campaigns, ${successfulStats.length} stats, ${lists.length} lists, and ${uniqueSubscribers.length} unsubscribers.`;
    return { success: true, message };
}


export async function getCampaigns(): Promise<Campaign[]> {
    const { data: summaryData } = await makeApiRequest('GET', 'campaigns', {
        page: '1',
        per_page: '50'
    });
    const summaryCampaigns = (Array.isArray(summaryData) ? summaryData : summaryData?.records) || [];
    if (summaryCampaigns.length === 0) return [];
    
    const campaigns = summaryCampaigns.filter((c: Campaign) => c.name && !c.name.toLowerCase().includes('farm') && !c.name.toLowerCase().includes('test'));
    return campaigns;
}

export async function getCampaignStats(campaignUid: string): Promise<CampaignStats | null> {
  try {
    const { data } = await makeApiRequest('GET', `campaigns/${campaignUid}/stats`);
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return null;
    }
    return { ...data, campaign_uid: campaignUid };
  } catch (error) {
    console.error(`Could not fetch or process stats for campaign ${campaignUid}. Reason:`, error);
    return null;
  }
}

    
