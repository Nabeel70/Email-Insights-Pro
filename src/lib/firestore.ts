import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from './firebase';
import type { Campaign } from './data';

export async function getCampaignsFromFirestore(): Promise<Campaign[]> {
  const campaignsCol = collection(db, 'campaigns');
  const q = query(campaignsCol, orderBy('send_at', 'desc'));
  const campaignSnapshot = await getDocs(q);
  const campaignList = campaignSnapshot.docs.map(doc => doc.data() as Campaign);
  return campaignList;
}

// Note: getCampaignStatsFromFirestore has been removed as it was part of the AI feature set.
// You will need a new way to fetch campaign statistics if required.
