import Dashboard from "@/components/dashboard";
import { getCampaigns, getTotalStats } from "@/lib/data";

export default function Home() {
  const campaigns = getCampaigns();
  const stats = getTotalStats(campaigns);

  return (
    <Dashboard initialCampaigns={campaigns} initialStats={stats} />
  );
}
