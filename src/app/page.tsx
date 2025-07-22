import { getCampaignsFromFirestore } from "@/lib/firestore";
import { getTotalStats } from "@/lib/data";
import { generateDailyReport } from "@/lib/reporting";
import { DashboardClientWrapper } from "@/components/dashboard-client-wrapper";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { CampaignStats } from "@/lib/data";


export default async function Home() {
  const campaigns = await getCampaignsFromFirestore();

  const statsPromises = campaigns.map(campaign => {
    const statsCol = collection(db, `campaigns/${campaign.campaign_uid}/stats`);
    return getDocs(statsCol);
  });

  const statsSnapshots = await Promise.all(statsPromises);
  const campaignStats: CampaignStats[] = [];
  statsSnapshots.forEach(snapshot => {
      snapshot.docs.forEach(doc => {
          campaignStats.push(doc.data() as CampaignStats);
      });
  });

  const stats = getTotalStats(campaignStats);
  const dailyReports = generateDailyReport(campaigns, campaignStats);

  return (
    <DashboardClientWrapper
      initialCampaigns={campaigns}
      initialStats={stats}
      initialDailyReports={dailyReports}
    />
  );
}
