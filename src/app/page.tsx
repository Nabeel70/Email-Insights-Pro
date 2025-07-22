import Dashboard from "@/components/dashboard";
import { getCampaignsFromFirestore, getCampaignStatsFromFirestore } from "@/lib/firestore";
import { getTotalStats } from "@/lib/data";
import { generateDailyReport } from "@/lib/reporting";
import withAuth from "@/components/with-auth";

// This part remains a Server Component to fetch data
async function PageData() {
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

// We wrap the data-fetching component with the Auth HOC
const AuthenticatedPage = withAuth(PageData);

// The final export is a simple component that renders the authenticated page
export default function Home() {
  return <AuthenticatedPage />;
}
