'use client';

import type { DailyReport, Stat } from '@/lib/data';
import React, { useState, useEffect, useCallback } from 'react';
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

export default function Dashboard() {
  const [dailyReport, setDailyReport] = useState<DailyReport[]>([]);
  const [totalStats, setTotalStats] = useState<Stat>({ totalSends: 0, totalOpens: 0, totalClicks: 0, totalUnsubscribes: 0, avgOpenRate: 0, avgClickThroughRate: 0});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const fetchReportsFromFirestore = useCallback(async () => {
    setLoading(true);
    try {
      const reportsCollection = collection(db, 'dailyReports');
      const q = firestoreQuery(reportsCollection, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const reports = querySnapshot.docs.map(doc => doc.data() as DailyReport);
      setDailyReport(reports);

      // We need to calculate total stats from the fetched reports
      const statsMap = new Map();
      reports.forEach(r => {
        statsMap.set(r.campaignName, {
            total_sent: r.totalSent,
            unique_opens: r.opens,
            unique_clicks: r.clicks,
            unsubscribes: r.unsubscribes,
            delivered: r.totalSent - r.bounces, // Approximate delivered
        });
      });
      const campaigns = reports.map(r => ({name: r.campaignName}));
      // @ts-ignore
      const calculatedStats = getTotalStats(campaigns, Array.from(statsMap.values()));
      setTotalStats(calculatedStats);


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

  useEffect(() => {
    fetchReportsFromFirestore();
  }, [fetchReportsFromFirestore]);

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
      // Refresh data from Firestore
      await fetchReportsFromFirestore();
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
              <h2 className="text-xl font-semibold tracking-tight mb-4">Campaign Performance</h2>
              <CampaignDataTable data={dailyReport} />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
