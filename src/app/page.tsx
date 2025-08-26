
'use client';

import { PageWithAuth } from '@/components/page-with-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, getDocs, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Campaign, CampaignStats, Subscriber, DailyReport } from '@/lib/types';
import { generateDailyReport } from '@/lib/reporting';
import { getTotalStats } from '@/lib/data';
import { 
  Loader, 
  RefreshCw, 
  Mail, 
  TrendingUp, 
  MousePointerClick, 
  UserX,
  Database,
  BarChart,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { formatDateString } from '@/lib/utils';
import { ClientOnly } from '@/components/ClientOnly';

export default function DashboardPage() {
  return (
    <PageWithAuth>
      <DashboardContent />
    </PageWithAuth>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<CampaignStats[]>([]);
  const [unsubscribers, setUnsubscribers] = useState<Subscriber[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [hourlySyncStatus, setHourlySyncStatus] = useState<any>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [campaignsSnapshot, statsSnapshot, unsubscribersSnapshot] = await Promise.all([
        getDocs(collection(db, 'rawCampaigns')),
        getDocs(collection(db, 'rawStats')),
        getDocs(collection(db, 'rawUnsubscribers'))
      ]);

      const campaignsData = campaignsSnapshot.docs.map(doc => doc.data() as Campaign);
      const statsData = statsSnapshot.docs.map(doc => doc.data() as CampaignStats);
      const unsubscribersData = unsubscribersSnapshot.docs
        .map(doc => doc.data() as Subscriber)
        .filter(sub => sub.status === 'unsubscribed');

      // Generate daily reports
      const reports = generateDailyReport(campaignsData, statsData);

      setCampaigns(campaignsData);
      setStats(statsData);
      setUnsubscribers(unsubscribersData);
      setDailyReports(reports);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast({
        title: 'Failed to load data',
        description: 'Could not fetch dashboard data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user) {
      fetchData();

      // Listen to job status updates
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
      };
    }
  }, [user, fetchData]);

  const totalStats = useMemo(() => getTotalStats(dailyReports), [dailyReports]);

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
      await fetchData();
    } catch (error) {
      console.error("Sync error:", error);
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

  // Analytics calculations
  const recentCampaigns = useMemo(() => {
    return campaigns
      .filter(c => c.status === 'sent')
      .sort((a, b) => new Date(b.send_at || b.date_added).getTime() - new Date(a.send_at || a.date_added).getTime())
      .slice(0, 5);
  }, [campaigns]);

  const recentUnsubscribes = useMemo(() => {
    return unsubscribers
      .sort((a, b) => new Date(b.date_added).getTime() - new Date(a.date_added).getTime())
      .slice(0, 10);
  }, [unsubscribers]);

  const campaignsByStatus = useMemo(() => {
    const statusCount: Record<string, number> = {};
    campaigns.forEach(campaign => {
      statusCount[campaign.status] = (statusCount[campaign.status] || 0) + 1;
    });
    return statusCount;
  }, [campaigns]);

  const topPerformingCampaigns = useMemo(() => {
    return dailyReports
      .filter(report => report.totalSent > 0)
      .sort((a, b) => b.openRate - a.openRate)
      .slice(0, 5);
  }, [dailyReports]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Email marketing analytics and insights</p>
        </div>
        <Button onClick={handleSync} disabled={syncing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Data'}
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {recentCampaigns.length} recent campaigns
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sends</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalSends.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all campaigns
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Open Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.avgOpenRate}%</div>
            <p className="text-xs text-muted-foreground">
              {totalStats.totalOpens.toLocaleString()} total opens
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Click Rate</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.avgClickThroughRate}%</div>
            <p className="text-xs text-muted-foreground">
              {totalStats.totalClicks.toLocaleString()} total clicks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Status Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Campaign Status
            </CardTitle>
            <CardDescription>
              Breakdown of campaigns by status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(campaignsByStatus).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    status === 'sent' ? 'bg-green-500' :
                    status === 'draft' ? 'bg-gray-500' :
                    status === 'scheduled' ? 'bg-blue-500' :
                    status === 'processing' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} />
                  <span className="capitalize text-sm">{status}</span>
                </div>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5" />
              Recent Unsubscribes
            </CardTitle>
            <CardDescription>
              Latest {recentUnsubscribes.length} unsubscriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentUnsubscribes.length > 0 ? (
                recentUnsubscribes.slice(0, 5).map((unsub, index) => (
                  <div key={unsub.subscriber_uid || index} className="flex justify-between items-center text-sm">
                    <span className="truncate max-w-[150px]">{unsub.EMAIL || 'Unknown'}</span>
                    <span className="text-muted-foreground text-xs">
                      {new Date(unsub.date_added).toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent unsubscribes</p>
              )}
              {recentUnsubscribes.length > 5 && (
                <div className="text-center pt-2">
                  <Badge variant="outline">{recentUnsubscribes.length - 5} more</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Top Performing
            </CardTitle>
            <CardDescription>
              Campaigns with highest open rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topPerformingCampaigns.length > 0 ? (
                topPerformingCampaigns.map((campaign, index) => (
                  <div key={campaign.campaignUid} className="flex justify-between items-center text-sm">
                    <span className="truncate max-w-[120px]">{campaign.campaignName}</span>
                    <Badge variant="secondary">{campaign.openRate}%</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No performance data</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Status
          </CardTitle>
          <CardDescription>
            Automated job status and data synchronization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientOnly>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
                <Clock className="h-6 w-6 text-primary mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">Hourly Data Sync</h3>
                    {hourlySyncStatus?.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : hourlySyncStatus?.status === 'failure' ? (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">Syncs all data from EP MailPro every hour</p>
                  {hourlySyncStatus ? (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground">
                        Last sync: {formatDateString(hourlySyncStatus.lastSuccess)}
                      </p>
                      {hourlySyncStatus.status === 'failure' && (
                        <p className="text-xs text-red-500 mt-1">
                          Error: {hourlySyncStatus.error}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-2">No sync data available</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
                <Mail className="h-6 w-6 text-primary mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">Daily Email Report</h3>
                    {jobStatus?.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : jobStatus?.status === 'failure' ? (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">Sends daily reports at 7 PM EST</p>
                  {jobStatus ? (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground">
                        Last report: {formatDateString(jobStatus.lastSuccess)}
                      </p>
                      {jobStatus.status === 'failure' && (
                        <p className="text-xs text-red-500 mt-1">
                          Error: {jobStatus.error}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-2">No report data available</p>
                  )}
                </div>
              </div>
            </div>
          </ClientOnly>
        </CardContent>
      </Card>

      {/* Recent Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Campaigns
          </CardTitle>
          <CardDescription>
            Latest {recentCampaigns.length} sent campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentCampaigns.length > 0 ? (
            <div className="space-y-4">
              {recentCampaigns.map((campaign) => {
                const campaignStats = stats.find(s => s.campaign_uid === campaign.campaign_uid);
                const openRate = campaignStats && campaignStats.delivery_success_count > 0
                  ? ((campaignStats.unique_opens_count || 0) / campaignStats.delivery_success_count * 100).toFixed(1)
                  : '0';
                
                return (
                  <div key={campaign.campaign_uid} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{campaign.name}</h4>
                      <p className="text-sm text-muted-foreground mb-1">{campaign.subject}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>From: {campaign.from_name}</span>
                        <span>Sent: {new Date(campaign.send_at || campaign.date_added).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{openRate}% open rate</Badge>
                      {campaignStats && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {(campaignStats.delivery_success_count || 0).toLocaleString()} delivered
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Recent Campaigns</h3>
              <p className="text-muted-foreground">
                Recent sent campaigns will appear here once data is synced.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
