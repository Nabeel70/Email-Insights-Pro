import Dashboard from "@/components/dashboard";
import { getCampaignsFromFirestore, getCampaignStatsFromFirestore } from "@/lib/firestore";
import { getTotalStats } from "@/lib/data";
import { generateDailyReport } from "@/lib/reporting";

export default async function Home() {
  const campaigns = await getCampaignsFromFirestore();
  const campaignStats = await getCampaignStatsFromFirestore();
  const stats = getTotalStats(campaignStats);
  const dailyReports = generateDailyReport(campaigns, campaignStats);

  return (
    <Dashboard 
      initialCampaigns={campaigns} 
      initialStats={stats}
      initialDailyReports={dailyReports}
    />
  );
}
