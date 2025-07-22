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
import { getCampaignsFromFirestore, getCampaignStatsFromFirestore } from '@/lib/firestore';
import { getTotalStats } from '@/lib/data';
import { generateDailyReport } from '@/lib/reporting';
import { AiInsights } from './ai-insights';


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
        const campaignStats = await getCampaignStatsFromFirestore(fetchedCampaigns);
        
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

          {/* Chart and AI Insights */}
          <section className="grid md:grid-cols-2 gap-8">
            <div>
                <h2 className="text-xl font-semibold tracking-tight mb-4">Campaign Trends</h2>
                <CampaignPerformanceChart data={chartData} />
            </div>
            <div>
                <h2 className="text-xl font-semibold tracking-tight mb-4">AI-Powered Insights</h2>
                <AiInsights reports={dailyReports} />
            </div>
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