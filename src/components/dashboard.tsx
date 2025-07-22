
'use client';

import type { Campaign, Stat, DailyReport, CampaignStats, Subscriber, EmailList } from '@/lib/data';
import React, { useState, useEffect } from 'react';
import { StatCard } from '@/components/stat-card';
import { CampaignPerformanceChart } from '@/components/campaign-performance-chart';
import { CampaignDataTable } from '@/components/campaign-data-table';
import { UnsubscribeDataTable } from '@/components/unsubscribe-data-table';
import { Send, MailOpen, MousePointerClick, UserMinus, LogOut, Loader } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { getCampaigns, getCampaignStats, getLists, getSubscribers } from '@/lib/epmailpro';
import { getTotalStats } from '@/lib/data';
import { generateDailyReport } from '@/lib/reporting';
import { useToast } from '@/hooks/use-toast';


export default function Dashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<Stat | null>(null);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [unsubscribers, setUnsubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Step 1: Fetch all campaigns first and handle empty state
        const allCampaigns = await getCampaigns();
        setCampaigns(allCampaigns);

        if (!allCampaigns || allCampaigns.length === 0) {
            console.log("No campaigns found. Halting data fetch.");
            setLoading(false);
            return;
        }
        
        // Step 2: Filter for only 'sent' campaigns to fetch stats for
        const sentCampaigns = allCampaigns.filter(c => c.status === 'sent');

        // Step 3: Fetch stats only for the sent campaigns
        const statsPromises = sentCampaigns.map(c => getCampaignStats(c.campaign_uid));
        const fetchedStats = (await Promise.all(statsPromises)).filter((s): s is CampaignStats => s !== null);
        
        // Step 4: Generate reports and stats based on the fetched data
        const totalStats = getTotalStats(allCampaigns, fetchedStats);
        const reports = generateDailyReport(allCampaigns, fetchedStats);

        setStats(totalStats);
        setDailyReports(reports);
        
        // Step 5: Fetch unsubscribers
        const fetchedLists = await getLists();
        const allUnsubscribers: Subscriber[] = [];

        for (const list of fetchedLists) {
          const listUnsubscribers = await getSubscribers(list.general.list_uid);
          allUnsubscribers.push(...listUnsubscribers);
        }
        
        setUnsubscribers(allUnsubscribers.filter(s => s.fields && s.fields.EMAIL));

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast({
          title: 'Failed to load data',
          description: 'Could not fetch data from the EP MailPro API. Please check your connection and API key.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  
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
        <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
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

      <main className="flex-1">
        <div className="container py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8">
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
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <section className="lg:col-span-2">
                <h2 className="text-xl font-semibold tracking-tight mb-4">Campaign Trends</h2>
                <CampaignPerformanceChart data={chartData} />
              </section>
              <section>
                <h2 className="text-xl font-semibold tracking-tight mb-4">Unsubscribed Users</h2>
                <UnsubscribeDataTable data={unsubscribers} />
              </section>
            </div>
            
            <section>
              <h2 className="text-xl font-semibold tracking-tight mb-4">Campaign Details</h2>
              <CampaignDataTable data={dailyReports} />
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
