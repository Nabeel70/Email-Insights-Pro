import Dashboard from "@/components/dashboard";
import { getCampaigns, getCampaignStats, getTotalStats } from "@/lib/data";
import { generateDailyReport } from "@/lib/reporting";

export default function Home() {
  const campaigns = getCampaigns();
  const campaignStats = getCampaignStats();
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
