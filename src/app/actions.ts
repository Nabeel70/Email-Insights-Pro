'use server';

import { getCampaigns, getCampaignStats } from '@/lib/epmailpro';
import { db } from '@/lib/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import type { Campaign, CampaignStats } from '@/lib/data';

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

export async function syncData() {
  try {
    const campaigns = await getCampaigns();
    if (campaigns.length === 0) {
      return { success: true, message: 'No new campaigns to sync.', campaignsCount: 0, statsCount: 0 };
    }

    const statsPromises = campaigns.map(c => getCampaignStats(c.campaign_uid));
    const statsResults = await Promise.allSettled(statsPromises);
    
    const successfulStats = statsResults
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled' && result.value)
      .map(result => result.value);

    await storeRawCampaigns(campaigns);
    await storeRawStats(successfulStats);
    
    return { 
      success: true, 
      message: `Sync complete. Stored ${campaigns.length} campaigns and ${successfulStats.length} stats records.`,
      campaignsCount: campaigns.length,
      statsCount: successfulStats.length,
    };
  } catch (error) {
    console.error('Client-side action error during sync:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return {
        success: false,
        error: `Failed to complete data sync: ${errorMessage}`
    }
  }
}
