
'use server';

import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { admin } from './firebaseAdmin'; 
import type { Campaign, CampaignStats, EmailList, Subscriber } from './types';
import { makeApiRequest } from './epmailpro';

// Initialize admin firestore instance
const adminDb = getAdminFirestore(admin.app());

async function getCampaign(campaignUid: string): Promise<Campaign | null> {
    try {
        const { data } = await makeApiRequest('GET', `campaigns/${campaignUid}`);
        if (!data) return null;
        return data as Campaign;
    } catch (error) {
        console.error(`Could not fetch details for campaign ${campaignUid}. Reason:`, error);
        return null;
    }
}

async function getCampaignsForSync(): Promise<Campaign[]> {
    const { data: summaryData } = await makeApiRequest('GET', 'campaigns', {
        page: '1',
        per_page: '50'
    });

    const summaryCampaigns = (Array.isArray(summaryData) ? summaryData : summaryData?.records) || [];

    if (summaryCampaigns.length === 0) {
        return [];
    }

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
    console.error(`Could not fetch or process stats for campaign ${campaignUid}. Reason:`, error);
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
    const { data } = await makeApiRequest('GET', 'lists');
    const allLists = (Array.isArray(data) ? data : data?.records) || [];
    
    const filteredLists = allLists.filter((list: EmailList) => {
        if (!list || !list.general?.name) return false;
        const lowerCaseName = list.general.name.toLowerCase();
        return !lowerCaseName.includes('farm') && !lowerCaseName.includes('test');
    });

    return filteredLists;
}

async function storeRawCampaigns(campaigns: Campaign[]) {
    if (campaigns.length === 0) return;
    const batch = adminDb.batch();
    const campaignsCollection = adminDb.collection('rawCampaigns');
    campaigns.forEach(campaign => {
      const docRef = campaignsCollection.doc(campaign.campaign_uid);
      batch.set(docRef, campaign, { merge: true });
    });
    await batch.commit();
}

async function storeRawStats(stats: CampaignStats[]) {
    if (stats.length === 0) return;
    const batch = adminDb.batch();
    const statsCollection = adminDb.collection('rawStats');
    stats.forEach(stat => {
        if (stat) {
            const docRef = statsCollection.doc(stat.campaign_uid);
            batch.set(docRef, stat, { merge: true });
        }
    });
    await batch.commit();
}

async function storeRawLists(lists: EmailList[]) {
    if (lists.length === 0) return;
    const batch = adminDb.batch();
    const listsCollection = adminDb.collection('rawLists');
    lists.forEach(list => {
        const docRef = listsCollection.doc(list.general.list_uid);
        batch.set(docRef, list);
    });
    await batch.commit();
}

async function storeRawUnsubscribes(subscribers: Subscriber[]) {
    if (subscribers.length === 0) return;
    const batch = adminDb.batch();
    const unsubscribesCollection = adminDb.collection('rawUnsubscribes');
    subscribers.forEach(sub => {
      if(sub && sub.subscriber_uid) {
          const docRef = unsubscribesCollection.doc(sub.subscriber_uid);
          batch.set(docRef, sub);
      }
    });
    await batch.commit();
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
            .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled' && result.value)
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
