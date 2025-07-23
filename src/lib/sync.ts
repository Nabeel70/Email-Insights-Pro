
'use server';

import type { Campaign, CampaignStats } from './data';
import { db } from './firebase'; 
import { collection, writeBatch, doc } from 'firebase/firestore';

export async function storeRawCampaigns(campaigns: Campaign[]) {
  if (campaigns.length === 0) return;
  const batch = writeBatch(db);
  const campaignsCollection = collection(db, 'rawCampaigns');
  campaigns.forEach(campaign => {
    const docRef = doc(campaignsCollection, campaign.campaign_uid);
    batch.set(docRef, campaign, { merge: true });
  });
  await batch.commit();
}

export async function storeRawStats(stats: CampaignStats[]) {
    if (stats.length === 0) return;
    const batch = writeBatch(db);
    const statsCollection = collection(db, 'rawStats');
    stats.forEach(stat => {
        if (stat) { // Ensure stat is not null
            const docRef = doc(statsCollection, stat.campaign_uid);
            batch.set(docRef, stat, { merge: true });
        }
    });
    await batch.commit();
}
