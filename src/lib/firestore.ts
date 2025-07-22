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

export async function getCampaignStatsFromFirestore(): Promise<CampaignStats[]> {
    const campaigns = await getCampaignsFromFirestore();
    const statsPromises = campaigns.map(campaign => {
        const statsCol = collection(db, `campaigns/${campaign.campaign_uid}/stats`);
        return getDocs(statsCol);
    });

    const statsSnapshots = await Promise.all(statsPromises);
    const allStats: CampaignStats[] = [];
    statsSnapshots.forEach(snapshot => {
        snapshot.docs.forEach(doc => {
            allStats.push(doc.data() as CampaignStats);
        });
    });

    return allStats;
}
