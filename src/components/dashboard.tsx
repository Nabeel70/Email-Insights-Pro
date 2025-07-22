'use client';

import type { Campaign, Stat, DailyReport } from '@/lib/data';
import React, { useState } from 'react';
import { StatCard } from '@/components/stat-card';
import { CampaignPerformanceChart } from '@/components/campaign-performance-chart';
import { AiInsightsCard } from '@/components/ai-insights-card';
import { CampaignDataTable } from '@/components/campaign-data-table';
import { Send, MailOpen, MousePointerClick, UserMinus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type DashboardProps = {
  initialCampaigns: Campaign[];
  initialStats: Stat;
  initialDailyReports: DailyReport[];
};

export default function Dashboard({ initialCampaigns, initialStats, initialDailyReports }: DashboardProps) {
  const [campaigns] = useState<Campaign[]>(initialCampaigns);
  const [dailyReports] = useState<DailyReport[]>(initialDailyReports);

  const chartData = dailyReports.map(report => ({
    name: report.campaignName,
    date: new Date(report.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    'Open Rate': report.openRate,
    'Click-Through Rate': report.clickRate,
  }));

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="mr-4 flex">
            <h1 className="text-2xl font-bold text-primary">Email Insights Pro</h1>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <Badge variant="outline" className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Sync Active
            </Badge>
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
                value={initialStats.totalSends.toLocaleString()}
                icon={<Send className="h-5 w-5 text-muted-foreground" />}
              />
              <StatCard
                title="Total Opens"
                value={initialStats.totalOpens.toLocaleString()}
                icon={<MailOpen className="h-5 w-5 text-muted-foreground" />}
                footer={`Avg. ${initialStats.avgOpenRate}% Open Rate`}
              />
              <StatCard
                title="Total Clicks"
                value={initialStats.totalClicks.toLocaleString()}
                icon={<MousePointerClick className="h-5 w-5 text-muted-foreground" />}
                footer={`Avg. ${initialStats.avgClickThroughRate}% Click-Through Rate`}
              />
               <StatCard
                title="Total Unsubscribes"
                value={initialStats.totalUnsubscribes.toLocaleString()}
                icon={<UserMinus className="h-5 w-5 text-muted-foreground" />}
              />
            </div>
          </section>

          {/* Chart and AI Insights */}
          <section className="grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
               <h2 className="text-xl font-semibold tracking-tight mb-4">Campaign Trends</h2>
              <CampaignPerformanceChart data={chartData} />
            </div>
            <div className="lg:col-span-2">
               <h2 className="text-xl font-semibold tracking-tight mb-4">AI-Powered Insights</h2>
              <AiInsightsCard campaigns={campaigns} />
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
