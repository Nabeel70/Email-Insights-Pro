'use client';

import { PageWithAuth } from '@/components/page-with-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Campaign, CampaignStats, Subscriber, DailyReport } from '@/lib/types';
import { exportAsJson, exportAsCsv, exportAsXml } from '@/lib/export';
import { 
  Loader, 
  Download, 
  RefreshCw, 
  FileJson, 
  FileSpreadsheet, 
  FileCode, 
  Database,
  Mail,
  UserX,
  BarChart
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ExportsPage() {
  return (
    <PageWithAuth>
      <ExportsContent />
    </PageWithAuth>
  );
}

function ExportsContent() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<CampaignStats[]>([]);
  const [unsubscribers, setUnsubscribers] = useState<Subscriber[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'xml'>('json');
  const { toast } = useToast();

  const fetchData = async () => {
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

      // Generate daily reports from campaigns and stats
      const reportsMap = new Map<string, Campaign>();
      campaignsData.forEach(campaign => {
        reportsMap.set(campaign.campaign_uid, campaign);
      });

      const reports: DailyReport[] = [];
      for (const stat of statsData) {
        const campaign = reportsMap.get(stat.campaign_uid);
        if (campaign && typeof stat.delivery_success_count === 'number' && stat.delivery_success_count > 0) {
          const totalSent = stat.processed_count || 0;
          const delivered = stat.delivery_success_count;
          const opens = stat.unique_opens_count || 0;
          const clicks = stat.unique_clicks_count || 0;
          const unsubscribes = stat.unsubscribes_count || 0;
          const bounces = stat.bounces_count || 0;

          const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 100;
          const openRate = delivered > 0 ? (opens / delivered) * 100 : 0;
          const clickRate = opens > 0 ? (clicks / opens) * 100 : 0;

          const sendDate = campaign.send_at || campaign.date_added;
          
          reports.push({
            campaignUid: campaign.campaign_uid,
            date: formatDate(sendDate),
            campaignName: campaign.name,
            fromName: campaign.from_name,
            subject: campaign.subject,
            totalSent,
            opens,
            clicks,
            unsubscribes,
            bounces,
            deliveryRate: parseFloat(deliveryRate.toFixed(2)),
            openRate: parseFloat(openRate.toFixed(2)),
            clickRate: parseFloat(clickRate.toFixed(2))
          });
        }
      }

      reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setCampaigns(campaignsData);
      setStats(statsData);
      setUnsubscribers(unsubscribersData);
      setDailyReports(reports);
    } catch (error) {
      console.error('Failed to fetch export data:', error);
      toast({
        title: 'Failed to load data',
        description: 'Could not fetch data for export.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      await fetchData(); // Refresh data after sync
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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  };

  const getExportIcon = (format: string) => {
    switch (format) {
      case 'json': return <FileJson className="h-4 w-4" />;
      case 'csv': return <FileSpreadsheet className="h-4 w-4" />;
      case 'xml': return <FileCode className="h-4 w-4" />;
      default: return <Download className="h-4 w-4" />;
    }
  };

  const handleExport = (dataType: 'campaigns' | 'stats' | 'unsubscribers' | 'reports', data: any[]) => {
    if (data.length === 0) {
      toast({
        title: 'No data to export',
        description: `No ${dataType} data available for export.`,
        variant: 'destructive',
      });
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `email-insights-${dataType}-${timestamp}`;

    try {
      switch (exportFormat) {
        case 'json':
          exportAsJson(data, `${filename}.json`);
          break;
        case 'csv':
          exportAsCsv(data, `${filename}.csv`);
          break;
        case 'xml':
          exportAsXml(data, `${filename}.xml`);
          break;
      }

      toast({
        title: 'Export successful',
        description: `${dataType} data exported as ${exportFormat.toUpperCase()}.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export failed',
        description: 'Failed to export data. Please try again.',
        variant: 'destructive',
      });
    }
  };

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
          <h1 className="text-3xl font-bold mb-2">Data Exports</h1>
          <p className="text-muted-foreground">Export email campaign data in multiple formats</p>
        </div>
        <Button onClick={handleSync} disabled={syncing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Data'}
        </Button>
      </div>

      {/* Export Format Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Settings
          </CardTitle>
          <CardDescription>
            Choose your preferred export format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Export Format:</label>
            <Select value={exportFormat} onValueChange={(value: 'json' | 'csv' | 'xml') => setExportFormat(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-4 w-4" />
                    JSON
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    CSV
                  </div>
                </SelectItem>
                <SelectItem value="xml">
                  <div className="flex items-center gap-2">
                    <FileCode className="h-4 w-4" />
                    XML
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaign Reports</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyReports.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Performance reports</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaigns</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total campaigns</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Statistics</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Campaign stats</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unsubscribes</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unsubscribers.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Unsubscribed users</p>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Campaign Performance Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Campaign Performance Reports
            </CardTitle>
            <CardDescription>
              Comprehensive performance data with metrics and rates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Daily Reports</p>
                <p className="text-sm text-muted-foreground">
                  {dailyReports.length} reports with delivery, open, and click rates
                </p>
              </div>
              <Badge variant="secondary">{dailyReports.length} records</Badge>
            </div>
            <Separator />
            <Button 
              onClick={() => handleExport('reports', dailyReports)}
              className="w-full"
              disabled={dailyReports.length === 0}
            >
              {getExportIcon(exportFormat)}
              <span className="ml-2">Export Reports as {exportFormat.toUpperCase()}</span>
            </Button>
          </CardContent>
        </Card>

        {/* Campaign Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Campaign Data
            </CardTitle>
            <CardDescription>
              Raw campaign information and metadata
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Campaign Details</p>
                <p className="text-sm text-muted-foreground">
                  {campaigns.length} campaigns with names, subjects, and status
                </p>
              </div>
              <Badge variant="secondary">{campaigns.length} records</Badge>
            </div>
            <Separator />
            <Button 
              onClick={() => handleExport('campaigns', campaigns)}
              className="w-full"
              disabled={campaigns.length === 0}
            >
              {getExportIcon(exportFormat)}
              <span className="ml-2">Export Campaigns as {exportFormat.toUpperCase()}</span>
            </Button>
          </CardContent>
        </Card>

        {/* Statistics Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Statistics Data
            </CardTitle>
            <CardDescription>
              Raw statistical data from EP MailPro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Campaign Statistics</p>
                <p className="text-sm text-muted-foreground">
                  {stats.length} statistical records with counts and metrics
                </p>
              </div>
              <Badge variant="secondary">{stats.length} records</Badge>
            </div>
            <Separator />
            <Button 
              onClick={() => handleExport('stats', stats)}
              className="w-full"
              disabled={stats.length === 0}
            >
              {getExportIcon(exportFormat)}
              <span className="ml-2">Export Statistics as {exportFormat.toUpperCase()}</span>
            </Button>
          </CardContent>
        </Card>

        {/* Unsubscribes Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5" />
              Unsubscribes Data
            </CardTitle>
            <CardDescription>
              Users who have unsubscribed from campaigns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Unsubscribed Users</p>
                <p className="text-sm text-muted-foreground">
                  {unsubscribers.length} unsubscribed users with email and dates
                </p>
              </div>
              <Badge variant="secondary">{unsubscribers.length} records</Badge>
            </div>
            <Separator />
            <Button 
              onClick={() => handleExport('unsubscribers', unsubscribers)}
              className="w-full"
              disabled={unsubscribers.length === 0}
            >
              {getExportIcon(exportFormat)}
              <span className="ml-2">Export Unsubscribes as {exportFormat.toUpperCase()}</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Export Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Export Information</CardTitle>
          <CardDescription>
            Important details about data exports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <FileJson className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">JSON Format</p>
                <p className="text-xs text-muted-foreground">Structured data for APIs</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">CSV Format</p>
                <p className="text-xs text-muted-foreground">Excel-compatible tables</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">XML Format</p>
                <p className="text-xs text-muted-foreground">Structured markup data</p>
              </div>
            </div>
          </div>
          <Separator />
          <p className="text-sm text-muted-foreground">
            All exports include timestamp in filename. Data is current as of the last sync from EP MailPro.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}