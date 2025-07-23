
'use server';

import type { Campaign, CampaignStats } from './data';
import { adminDb } from './firebase-admin'; 
import { collection, writeBatch, doc } from 'firebase/firestore';

export async function storeRawCampaigns(campaigns: Campaign[]) {
  if (campaigns.length === 0) return;
  const batch = adminDb.batch();
  const campaignsCollection = adminDb.collection('rawCampaigns');
  campaigns.forEach(campaign => {
    const docRef = campaignsCollection.doc(campaign.campaign_uid);
    batch.set(docRef, campaign, { merge: true });
  });
  await batch.commit();
}

export async function storeRawStats(stats: CampaignStats[]) {
    if (stats.length === 0) return;
    const batch = adminDb.batch();
    const statsCollection = adminDb.collection('rawStats');
    stats.forEach(stat => {
        if (stat) { // Ensure stat is not null
            const docRef = statsCollection.doc(stat.campaign_uid);
            batch.set(docRef, stat, { merge: true });
        }
    });
    await batch.commit();
}
