'use client';

import type { DailyReport, Campaign, CampaignStats } from '@/lib/data';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LogOut, Loader, RefreshCw, Mail, MousePointerClick, TrendingUp, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getTotalStats } from '@/lib/data';
import { StatCard } from './stat-card';
import { CampaignDataTable } from './campaign-data-table';
import { db } from '@/lib/firebase';
import { collection, getDocs, query as firestoreQuery, writeBatch, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { generateDailyReport } from '@/lib/reporting';
import { getCampaigns, getCampaignStats } from '@/lib/epmailpro';


export default function Dashboard() {
  const [dailyReport, setDailyReport] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const [rawCampaigns, setRawCampaigns] = useState<Campaign[]>([]);
  const [rawStats, setRawStats] = useState<CampaignStats[]>([]);

  const fetchFromFirestore = useCallback(async () => {
    setLoading(true);
    try {
      const campaignsCollection = collection(db, 'rawCampaigns');
      const statsCollection = collection(db, 'rawStats');

      const campaignsSnapshot = await getDocs(firestoreQuery(campaignsCollection));
      const statsSnapshot = await getDocs(firestoreQuery(statsCollection));

      const campaigns = campaignsSnapshot.docs.map(doc => doc.data() as Campaign);
      const stats = statsSnapshot.docs.map(doc => doc.data() as CampaignStats);
      
      setRawCampaigns(campaigns);
      setRawStats(stats);

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
    fetchFromFirestore();
  }, [fetchFromFirestore]);
  
  const totalStats = useMemo(() => getTotalStats(dailyReport), [dailyReport]);
  const transformedApiData = useMemo(() => {
      const report = generateDailyReport(rawCampaigns, rawStats);
      setDailyReport(report);
      return report;
  }, [rawCampaigns, rawStats]);
  
  const storeRawCampaigns = async (campaigns: Campaign[]) => {
    if (campaigns.length === 0) return;
    const batch = writeBatch(db);
    const campaignsCollection = collection(db, 'rawCampaigns');
    campaigns.forEach(campaign => {
      const docRef = doc(campaignsCollection, campaign.campaign_uid);
      batch.set(docRef, campaign, { merge: true });
    });
    await batch.commit();
  };

  const storeRawStats = async (stats: CampaignStats[]) => {
      if (stats.length === 0) return;
      const batch = writeBatch(db);
      const statsCollection = collection(db, 'rawStats');
      stats.forEach(stat => {
          if (stat) {
              const docRef = doc(statsCollection, stat.campaign_uid);
              batch.set(docRef, stat, { merge: true });
          }
      });
      await batch.commit();
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
        const campaigns = await getCampaigns();
        if (campaigns.length === 0) {
            toast({
                title: 'Sync Complete',
                description: 'No new campaigns to sync.',
            });
            return;
        }

        const statsPromises = campaigns.map(c => getCampaignStats(c.campaign_uid));
        const statsResults = await Promise.allSettled(statsPromises);
        
        const successfulStats = statsResults
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled' && result.value)
        .map(result => result.value);

        await storeRawCampaigns(campaigns);
        await storeRawStats(successfulStats);
      
        toast({
            title: 'Sync Successful',
            description: `Sync complete. Stored ${campaigns.length} campaigns and ${successfulStats.length} stats records.`,
        });
        await fetchFromFirestore(); // Re-fetch data to update the UI
    } catch (error) {
      console.error("Client-side action error during sync:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({
          title: 'Sync Failed',
          description: `Failed to complete data sync: ${errorMessage}`,
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
  
  const handleRefresh = () => {
      fetchFromFirestore();
  }

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
          <div className="flex flex-1 items-center justify-end space-x-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/firestore-diagnostics')}>
                <Server className="mr-2 h-4 w-4" />
                Firestore Diagnostics
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
            <Button variant="default" size="sm" onClick={handleSync} disabled={syncing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              Sync from API
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
                    <StatCard title="Total Sends" value={totalStats.totalSends.toLocaleString()} icon={<Mail className="h-4 w-4 text-muted-foreground" />} footer="Based on stored data" />
                    <StatCard title="Total Opens" value={totalStats.totalOpens.toLocaleString()} icon={<Mail className="h-4 w-4 text-muted-foreground" />} footer="Based on stored data" />
                    <StatCard title="Avg. Open Rate" value={`${totalStats.avgOpenRate}%`} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} footer="Based on stored data" />
                    <StatCard title="Avg. Click Rate" value={`${totalStats.avgClickThroughRate}%`} icon={<MousePointerClick className="h-4 w-4 text-muted-foreground" />} footer="Based on stored data" />
                </div>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold tracking-tight mb-4">Campaign Performance (from Firestore)</h2>
              <CampaignDataTable data={dailyReport} />
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Raw Campaigns (from Firestore)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted p-4 rounded-md text-xs overflow-auto h-96">
                        {JSON.stringify(rawCampaigns, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Raw Stats (from Firestore)</CardTitle>
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
