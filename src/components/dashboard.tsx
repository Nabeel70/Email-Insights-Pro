'use client';

import type { Campaign, CampaignStats, DailyReport, Stat } from '@/lib/data';
import React, { useState, useEffect, useMemo } from 'react';
import { LogOut, Loader, Mail, MousePointerClick, TrendingUp, UserMinus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { getCampaigns, getCampaignStats } from '@/lib/epmailpro';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateDailyReport } from '@/lib/reporting';
import { CampaignDataTable } from './campaign-data-table';
import { StatCard } from './stat-card';
import { getTotalStats } from '@/lib/data';

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<CampaignStats[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const fetchedCampaigns = await getCampaigns();
        setCampaigns(fetchedCampaigns);

        const statsPromises = fetchedCampaigns.map(c => getCampaignStats(c.campaign_uid));
        const statsResults = await Promise.allSettled(statsPromises);
        
        const successfulStats = statsResults
          .filter(result => result.status === 'fulfilled' && result.value)
          .map(result => (result as PromiseFulfilledResult<CampaignStats>).value);

        setStats(successfulStats);

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast({
          title: 'Failed to load campaigns',
          description: (error as Error).message || 'Could not fetch campaign data from the EP MailPro API.',
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
  
  const dailyReport: DailyReport[] = useMemo(() => {
      if (campaigns.length === 0 || stats.length === 0) return [];
      return generateDailyReport(campaigns, stats);
  }, [campaigns, stats]);

  const totalStats: Stat = useMemo(() => {
      return getTotalStats(campaigns, stats);
  }, [campaigns, stats]);


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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard title="Total Sends" value={totalStats.totalSends.toLocaleString()} icon={<Mail className="h-4 w-4 text-muted-foreground" />} />
                    <StatCard title="Total Opens" value={totalStats.totalOpens.toLocaleString()} icon={<Mail className="h-4 w-4 text-muted-foreground" />} />
                    <StatCard title="Avg. Open Rate" value={`${totalStats.avgOpenRate}%`} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} />
                    <StatCard title="Avg. Click Rate" value={`${totalStats.avgClickThroughRate}%`} icon={<MousePointerClick className="h-4 w-4 text-muted-foreground" />} />
                </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-tight mb-4">Campaign Performance</h2>
              <CampaignDataTable data={dailyReport} />
            </section>
            
            <section>
               <Card>
                <CardHeader>
                    <CardTitle>Raw Daily Report (Processed) </CardTitle>
                </CardHeader>
                <CardContent>
                    <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto h-64">
                        {JSON.stringify(dailyReport, null, 2)}
                    </pre>
                </CardContent>
               </Card>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
