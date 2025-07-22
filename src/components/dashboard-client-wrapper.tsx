'use client';

import withAuth from "@/components/with-auth";
import Dashboard from "@/components/dashboard";
import type { Campaign, Stat, DailyReport } from '@/lib/data';

type DashboardWrapperProps = {
  initialCampaigns: Campaign[];
  initialStats: Stat;
  initialDailyReports: DailyReport[];
};

function DashboardWrapper({ initialCampaigns, initialStats, initialDailyReports }: DashboardWrapperProps) {
  return (
    <Dashboard 
      initialCampaigns={initialCampaigns} 
      initialStats={initialStats}
      initialDailyReports={initialDailyReports}
    />
  );
}

export const DashboardClientWrapper = withAuth(DashboardWrapper);
