
'use client';

import type { DailyReport, Campaign, CampaignStats } from '@/lib/types';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LogOut, Loader, RefreshCw, Mail, MousePointerClick, TrendingUp, UserX, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getTotalStats } from '@/lib/data';
import { StatCard } from '@/components/stat-card';
import { CampaignDataTable } from '@/components/campaign-data-table';
import { db } from '@/lib/firebase';
import { collection, getDocs, query as firestoreQuery, doc, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { generateDailyReport } from '@/lib/reporting';
import { AuthGuard } from '@/components/auth-guard';
import dynamic from 'next/dynamic';

function DashboardPageContent() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const [rawCampaigns, setRawCampaigns] = useState<Campaign[]>([]);
  const [rawStats, setRawStats] = useState<CampaignStats[]>([]);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [hourlySyncStatus, setHourlySyncStatus] = useState<any>(null);

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

    const dailyReportJobStatusDocRef = doc(db, 'jobStatus', 'dailyEmailReport');
    const hourlySyncJobStatusDocRef = doc(db, 'jobStatus', 'hourlySync');

    const unsubDaily = onSnapshot(dailyReportJobStatusDocRef, (doc) => {
        setJobStatus(doc.data());
    });
    const unsubHourly = onSnapshot(hourlySyncJobStatusDocRef, (doc) => {
        setHourlySyncStatus(doc.data());
    });

    return () => {
        unsubDaily();
        unsubHourly();
    }
  }, [fetchFromFirestore]);

  const dailyReport = useMemo(() => {
    return generateDailyReport(rawCampaigns, rawStats);
  }, [rawCampaigns, rawStats]);

  const totalStats = useMemo(() => getTotalStats(dailyReport), [dailyReport]);
  

  const handleSync = async () => {
    setSyncing(true);
    try {
        const response = await fetch('/api/manual-sync', { method: 'GET' });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Sync failed due to server error.');
        }
        toast({
            title: 'Sync Successful',
            description: result.message,
        });
        await fetchFromFirestore();
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

  return (
    <>
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
            <div className="mr-4 flex">
              <h1 className="text-2xl font-bold text-primary">Email Insights Pro</h1>
            </div>
            <div className="flex flex-1 items-center justify-end space-x-2">
               <Button variant="outline" size="sm" onClick={() => router.push('/unsubscribes')}>
                  <UserX className="mr-2 h-4 w-4" />
                  View Unsubscribes
              </Button>
              <Button variant="default" size="sm" onClick={handleSync} disabled={syncing || loading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${syncing || loading ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync from API'}
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
            {loading && dailyReport.length === 0 ? (
               <div className="flex items-center justify-center min-h-[50vh]">
                 <Loader className="h-8 w-8 animate-spin" />
               </div>
            ) : (
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
                      <Card>
                          <CardHeader>
                              <CardTitle>Automated Job Status</CardTitle>
                              <CardDescription>
                                  This service automatically performs scheduled tasks like sending reports and syncing data.
                              </CardDescription>
                          </CardHeader>
                          <CardContent className="grid gap-4 sm:grid-cols-2">
                             <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
                                 <RefreshCw className="h-6 w-6 text-primary mt-1"/>
                                 <div>
                                     <h3 className="font-semibold">Hourly Data Sync</h3>
                                     <p className="text-muted-foreground">Syncs all data from the API every hour.</p>
                                      {(loading && !hourlySyncStatus) ? (
                                         <p className="text-muted-foreground mt-2">Loading status...</p>
                                     ) : hourlySyncStatus ? (
                                         <>
                                          <p className="text-xs text-muted-foreground mt-2">Last successful sync:</p>
                                          <p className="font-semibold text-sm text-foreground">{hourlySyncStatus.lastSuccess ? new Date(hourlySyncStatus.lastSuccess).toLocaleString() : 'Never'}</p>
                                          {hourlySyncStatus.status === 'failure' && (
                                              <>
                                                  <p className="text-destructive mt-1 text-xs">Last attempt failed: {new Date(hourlySyncStatus.lastFailure).toLocaleString()}</p>
                                                  <p className="text-xs text-destructive">Error: {hourlySyncStatus.error}</p>
                                              </>
                                          )}
                                         </>
                                     ) : (
                                         <p className="text-muted-foreground mt-2">No hourly sync has run yet.</p>
                                     )}
                                 </div>
                             </div>
                             <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
                                 <FileText className="h-6 w-6 text-primary mt-1"/>
                                 <div>
                                     <h3 className="font-semibold">Daily Email Report</h3>
                                     <p className="text-muted-foreground">Sends a report daily at 7 PM EST (23:00 UTC).</p>
                                     {(loading && !jobStatus) ? (
                                         <p className="text-muted-foreground mt-2">Loading status...</p>
                                     ) : jobStatus ? (
                                         <>
                                          <p className="text-xs text-muted-foreground mt-2">Last successful report:</p>
                                          <p className="font-semibold text-sm text-foreground">{jobStatus.lastSuccess ? new Date(jobStatus.lastSuccess).toLocaleString() : 'Never'}</p>
                                          {jobStatus.status === 'failure' && (
                                              <>
                                                  <p className="text-destructive mt-1 text-xs">Last attempt failed: {new Date(jobStatus.lastFailure).toLocaleString()}</p>
                                                  <p className="text-xs text-destructive">Error: {jobStatus.error}</p>
                                              </>
                                          )}
                                         </>
                                     ) : (
                                         <p className="text-muted-foreground mt-2">No reports have been sent yet.</p>
                                     )}
                                 </div>
                             </div>
                          </CardContent>
                      </Card>
                  </section>
                
                <section>
                  <h2 className="text-xl font-semibold tracking-tight mb-4">Campaign Performance (from Firestore)</h2>
                  <CampaignDataTable data={dailyReport} />
                </section>

              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

const DynamicDashboardPage = dynamic(
  () => Promise.resolve(DashboardPageContent),
  { ssr: false, loading: () => <div className="flex items-center justify-center min-h-screen"><Loader className="h-8 w-8 animate-spin" /></div> }
);


export default function DashboardPage() {
  return (
    <AuthGuard>
      <DynamicDashboardPage />
    </AuthGuard>
  );
}
