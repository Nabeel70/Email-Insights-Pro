import { adminDb } from './firebase-admin';
import type { Campaign } from './data';

export async function getCampaignsFromFirestore(): Promise<Campaign[]> {
  const campaignsCol = adminDb.collection('campaigns');
  const q = campaignsCol.orderBy('send_at', 'desc');
  const campaignSnapshot = await q.get();
  const campaignList = campaignSnapshot.docs.map(doc => doc.data() as Campaign);
  return campaignList;
}
