
'use server';

import { db } from './firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import type { Campaign, CampaignStats, EmailList, Subscriber } from './types';
import { getCampaigns, getCampaignStats, getLists, getUnsubscribedSubscribers } from './epmailpro';


async function storeRawCampaigns(campaigns: Campaign[]) {
    if (campaigns.length === 0) return;
    const batch = writeBatch(db);
    const campaignsCollection = collection(db, 'rawCampaigns');
    campaigns.forEach(campaign => {
      const docRef = doc(campaignsCollection, campaign.campaign_uid);
      batch.set(docRef, campaign, { merge: true });
    });
    await batch.commit();
}

async function storeRawStats(stats: CampaignStats[]) {
    if (stats.length === 0) return;
    const batch = writeBatch(db);
    const statsCollection = collection(db, 'rawStats');
    stats.forEach(stat => {
        if (stat) {
            const docRef = doc(statsCollection, stat.campaign_uid);
            batch.set(docRef, stat, { merge: true });
        }
    });
    await batch.commit();
}

async function storeRawLists(lists: EmailList[]) {
    if (lists.length === 0) return;
    const batch = writeBatch(db);
    const listsCollection = collection(db, 'rawLists');
    lists.forEach(list => {
        const docRef = doc(listsCollection, list.general.list_uid);
        batch.set(docRef, list);
    });
    await batch.commit();
}

async function storeRawUnsubscribes(subscribers: Subscriber[]) {
    if (subscribers.length === 0) return;
    const batch = writeBatch(db);
    const unsubscribesCollection = collection(db, 'rawUnsubscribes');
    subscribers.forEach(sub => {
      if(sub && sub.subscriber_uid) {
          const docRef = doc(unsubscribesCollection, sub.subscriber_uid);
          batch.set(docRef, sub);
      }
    });
    await batch.commit();
}


export async function syncAllData() {
    console.log("Starting full data sync...");

    // 1. Fetch and store campaigns and their stats
    const campaigns = await getCampaigns();
    let successfulStats: CampaignStats[] = [];
    if (campaigns.length > 0) {
        const statsPromises = campaigns.map(c => getCampaignStats(c.campaign_uid));
        const statsResults = await Promise.allSettled(statsPromises);
        successfulStats = statsResults
            .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled' && result.value)
            .map(result => result.value);
    }
    await storeRawCampaigns(campaigns);
    await storeRawStats(successfulStats);
    console.log(`Synced ${campaigns.length} campaigns and ${successfulStats.length} stats records.`);

    // 2. Fetch and store lists and their unsubscribers
    const lists: EmailList[] = await getLists();
    let uniqueSubscribers: Subscriber[] = [];
    if (lists.length > 0) {
        const unsubscriberPromises = lists.map(list => getUnsubscribedSubscribers(list.general.list_uid));
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
