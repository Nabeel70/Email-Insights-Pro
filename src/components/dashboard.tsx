
'use client';

import type { DailyReport, Campaign, CampaignStats } from '@/lib/data';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LogOut, Loader, RefreshCw, Mail, MousePointerClick, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getTotalStats } from '@/lib/data';
import { StatCard } from './stat-card';
import { CampaignDataTable } from './campaign-data-table';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query as firestoreQuery } from 'firebase/firestore';
import { getCampaigns, getCampaignStats } from '@/lib/epmailpro';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { formatDateString } from '@/lib/utils';

function transformStatsToDailyReport(stats: (CampaignStats | null)[], campaigns: Campaign[]): DailyReport[] {
  if (!stats || !campaigns) return [];

  const campaignMap = new Map(campaigns.map(c => [c.campaign_uid, c]));

  return stats
    .map((stat) => {
      if (!stat || !stat.campaign_uid) return null;
      
      const campaign = campaignMap.get(stat.campaign_uid);
      if (!campaign) return null;

      const delivered = stat.delivery_success_count ?? 0;
      const totalSent = stat.processed_count ?? 0;
      const uniqueOpens = stat.unique_opens_count ?? 0;
      const uniqueClicks = stat.unique_clicks_count ?? 0;

      const openRate = delivered > 0 ? (uniqueOpens / delivered) * 100 : 0;
      const clickRate = delivered > 0 ? (uniqueClicks / delivered) * 100 : 0;
      const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 0;

      return {
        date: formatDateString(campaign?.send_at || campaign?.date_added),
        campaignName: campaign?.name ?? 'Unknown',
        fromName: campaign?.from_name ?? 'N/A',
        subject: campaign?.subject ?? '',
        totalSent: totalSent,
        opens: uniqueOpens,
        clicks: uniqueClicks,
        openRate: parseFloat(openRate.toFixed(2)),
        clickRate: parseFloat(clickRate.toFixed(2)),
        unsubscribes: stat.unsubscribes_count ?? 0,
        bounces: stat.bounces_count ?? 0,
        deliveryRate: parseFloat(deliveryRate.toFixed(2)),
      };
    })
    .filter((report): report is DailyReport => report !== null);
}

export default function Dashboard() {
  const [dailyReport, setDailyReport] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const [rawCampaigns, setRawCampaigns] = useState<Campaign[]>([]);
  const [rawStats, setRawStats] = useState<(CampaignStats | null)[]>([]);

  const fetchReportsFromFirestore = useCallback(async () => {
    setLoading(true);
    try {
      const reportsCollection = collection(db, 'dailyReports');
      const q = firestoreQuery(reportsCollection, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const reports = querySnapshot.docs.map(doc => doc.data() as DailyReport);
      setDailyReport(reports);
    } catch (error) {
      console.error("Failed to fetch reports from Firestore:", error);
      toast({
        title: 'Failed to load reports',
        description: (error as Error).message || 'Could not fetch report data from Firestore.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  const fetchRawDataForDebug = useCallback(async () => {
    try {
      const fetchedCampaigns = await getCampaigns();
      setRawCampaigns(fetchedCampaigns);

      const statsPromises = fetchedCampaigns.map(c => getCampaignStats(c.campaign_uid));
      const fetchedStats = await Promise.all(statsPromises);
      setRawStats(fetchedStats);
    } catch (error) {
       console.error("Failed to fetch raw data for debug:", error);
    }
  }, []);


  useEffect(() => {
    fetchReportsFromFirestore();
    fetchRawDataForDebug();
  }, [fetchReportsFromFirestore, fetchRawDataForDebug]);
  
  const totalStats = useMemo(() => getTotalStats(dailyReport), [dailyReport]);
  const transformedApiData = useMemo(() => transformStatsToDailyReport(rawStats, rawCampaigns), [rawStats, rawCampaigns]);


  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/sync');
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Sync failed');
      }
      toast({
        title: 'Sync Successful',
        description: `${result.reportsCount} reports have been synced.`,
      });
      // Re-fetch data from Firestore to update the UI
      await fetchReportsFromFirestore();
      await fetchRawDataForDebug();
    } catch (error) {
      console.error("Sync error:", error);
      toast({
        title: 'Sync Failed',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };
  
  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (loading && dailyReport.length === 0 && transformedApiData.length === 0) {
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
            <Badge variant={syncing ? 'secondary' : 'outline'} className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${syncing ? 'bg-amber-400' : 'bg-green-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${syncing ? 'bg-amber-500' : 'bg-green-500'}`}></span>
              </span>
              {syncing ? 'Syncing' : 'Sync Active'}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              Sync Data
            </Button>
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
              <h2 className="text-xl font-semibold tracking-tight mb-4">Campaign Performance (Live API Data)</h2>
              <CampaignDataTable data={transformedApiData} />
            </section>
            
            <section>
              <h2 className="text-xl font-semibold tracking-tight mb-4">Campaign Performance (Stored Firestore Data)</h2>
              <CampaignDataTable data={dailyReport} />
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Raw Campaigns API Response</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted p-4 rounded-md text-xs overflow-auto h-96">
                        {JSON.stringify(rawCampaigns, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Raw Stats API Response</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted p-4 rounded-md text-xs overflow-auto h-96">
                        {JSON.stringify(rawStats, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>Processed Daily Report Data (from Firestore)</CardTitle>
                </CardHeader>
                <CardContent>
                    <pre className="bg-muted p-4 rounded-md text-xs overflow-auto h-96">
                    {JSON.stringify(dailyReport, null, 2)}
                    </pre>
                </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
