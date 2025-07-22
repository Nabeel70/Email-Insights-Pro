'use client';

import type { Campaign, Stat, DailyReport, CampaignStats } from '@/lib/data';
import React, { useState, useEffect } from 'react';
import { StatCard } from '@/components/stat-card';
import { CampaignPerformanceChart } from '@/components/campaign-performance-chart';
import { CampaignDataTable } from '@/components/campaign-data-table';
import { Send, MailOpen, MousePointerClick, UserMinus, LogOut, Loader } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { getCampaignsFromFirestore } from '@/lib/firestore';
import { getTotalStats } from '@/lib/data';
import { generateDailyReport } from '@/lib/reporting';

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<Stat | null>(null);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const fetchedCampaigns = await getCampaignsFromFirestore();
        // Assuming getCampaignStatsFromFirestore is no longer needed or will be adapted
        // For now, let's simulate stats or adapt data flow if necessary.
        // This part needs clarification on how stats are obtained without the AI backend.
        // For the purpose of this change, we'll assume stats are derived differently or not needed for the main view.
        
        // Let's generate a placeholder for stats for now.
        const campaignStats: CampaignStats[] = fetchedCampaigns.map(c => ({
          campaign_uid: c.campaign_uid,
          total_sent: Math.floor(Math.random() * 2000) + 1000,
          unique_opens: Math.floor(Math.random() * 1000),
          unique_clicks: Math.floor(Math.random() * 500),
          unsubscribes: Math.floor(Math.random() * 50),
          bounces: Math.floor(Math.random() * 20),
          complaints: 0,
          delivered: Math.floor(Math.random() * 1800) + 900,
          timestamp: new Date().toISOString(),
        }));


        const totalStats = getTotalStats(campaignStats);
        const reports = generateDailyReport(fetchedCampaigns, campaignStats);

        setCampaigns(fetchedCampaigns);
        setStats(totalStats);
        setDailyReports(reports);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        // Optionally, show a toast notification for the error
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  
  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const chartData = dailyReports.map(report => ({
    name: report.campaignName,
    date: new Date(report.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    'Open Rate': report.openRate,
    'Click-Through Rate': report.clickRate,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="mr-4 flex">
            <h1 className="text-2xl font-bold text-primary">Email Insights Pro</h1>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <Badge variant="outline" className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Sync Active
            </Badge>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-8">
        <div className="flex flex-col gap-8">
          {/* Stats Grid */}
          <section>
            <h2 className="text-xl font-semibold tracking-tight mb-4">Overall Performance</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Sends"
                value={stats?.totalSends.toLocaleString() ?? '0'}
                icon={<Send className="h-5 w-5 text-muted-foreground" />}
              />
              <StatCard
                title="Total Opens"
                value={stats?.totalOpens.toLocaleString() ?? '0'}
                icon={<MailOpen className="h-5 w-5 text-muted-foreground" />}
                footer={`Avg. ${stats?.avgOpenRate ?? 0}% Open Rate`}
              />
              <StatCard
                title="Total Clicks"
                value={stats?.totalClicks.toLocaleString() ?? '0'}
                icon={<MousePointerClick className="h-5 w-5 text-muted-foreground" />}
                footer={`Avg. ${stats?.avgClickThroughRate ?? 0}% Click-Through Rate`}
              />
               <StatCard
                title="Total Unsubscribes"
                value={stats?.totalUnsubscribes.toLocaleString() ?? '0'}
                icon={<UserMinus className="h-5 w-5 text-muted-foreground" />}
              />
            </div>
          </section>

          {/* Chart */}
          <section>
              <h2 className="text-xl font-semibold tracking-tight mb-4">Campaign Trends</h2>
              <CampaignPerformanceChart data={chartData} />
          </section>

          {/* Campaign Data Table */}
          <section>
            <h2 className="text-xl font-semibold tracking-tight mb-4">Campaign Details</h2>
            <CampaignDataTable data={dailyReports} />
          </section>
        </div>
      </main>
    </div>
  );
}
