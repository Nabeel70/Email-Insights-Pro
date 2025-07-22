import { db } from './firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { Campaign, CampaignStats } from './data';

export async function getCampaignsFromFirestore(): Promise<Campaign[]> {
  const campaignsCol = collection(db, 'campaigns');
  const q = query(campaignsCol, orderBy('send_at', 'desc'));
  const campaignSnapshot = await getDocs(q);
  const campaignList = campaignSnapshot.docs.map(doc => doc.data() as Campaign);
  return campaignList;
}
