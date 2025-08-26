'use client';

import { PageWithAuth } from '@/components/page-with-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Campaign, CampaignStats } from '@/lib/types';
import { Loader, Mail, Eye, MousePointer, UserX, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CampaignsPage() {
  return (
    <PageWithAuth>
      <CampaignsContent />
    </PageWithAuth>
  );
}

function CampaignsContent() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<CampaignStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  // Get last 10 campaigns as per PRD REQ 8.2.2
  const last10Campaigns = useMemo(() => {
    return campaigns
      .sort((a, b) => new Date(b.date_added || 0).getTime() - new Date(a.date_added || 0).getTime())
      .slice(0, 10);
  }, [campaigns]);

  const fetchData = async () => {
    try {
      const [campaignsSnapshot, statsSnapshot] = await Promise.all([
        getDocs(collection(db, 'rawCampaigns')),
        getDocs(collection(db, 'rawStats'))
      ]);

      const campaignsData = campaignsSnapshot.docs.map(doc => doc.data() as Campaign);
      const statsData = statsSnapshot.docs.map(doc => doc.data() as CampaignStats);

      setCampaigns(campaignsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
      toast({
        title: 'Failed to load campaigns',
        description: 'Could not fetch campaign data from Firestore.',
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

  // Simple spark-line trend indicator based on performance
  const getTrendIndicator = (campaignStats: CampaignStats | undefined) => {
    if (!campaignStats) return <Minus className="h-4 w-4 text-muted-foreground" />;
    
    const openRate = campaignStats.opens_rate || 0;
    if (openRate > 25) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (openRate < 15) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
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
          <h1 className="text-3xl font-bold mb-2">Campaigns</h1>
          <p className="text-muted-foreground">Last 10 campaigns with performance trends</p>
        </div>
        <Button onClick={handleSync} disabled={syncing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Data'}
        </Button>
      </div>

      {last10Campaigns.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No campaigns found</h3>
              <p className="text-muted-foreground mb-4">
                No campaign data is available. Try syncing data from EP MailPro.
              </p>
              <Button onClick={handleSync} disabled={syncing}>
                {syncing ? 'Syncing...' : 'Sync Campaigns'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {last10Campaigns.map((campaign) => {
            const campaignStats = stats.find(s => s.campaign_uid === campaign.campaign_uid);
            const trendIndicator = getTrendIndicator(campaignStats);
            
            return (
              <Card key={campaign.campaign_uid} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <CardTitle className="text-lg">{campaign.name}</CardTitle>
                        {trendIndicator}
                      </div>
                      <CardDescription className="mb-1">
                        <span className="font-medium">From:</span> {campaign.from_name}
                      </CardDescription>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Subject:</span> {campaign.subject}
                      </p>
                      {campaign.date_added && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Created: {new Date(campaign.date_added).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status || '')}`}>
                        {campaign.status}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                
                {campaignStats && (
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">Sent</p>
                          <p className="text-lg font-bold">{(campaignStats.processed_count || 0).toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Eye className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">Opens</p>
                          <p className="text-lg font-bold">{(campaignStats.opens_count || 0).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{(campaignStats.opens_rate || 0).toFixed(1)}%</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <MousePointer className="h-4 w-4 text-purple-500" />
                        <div>
                          <p className="text-sm font-medium">Clicks</p>
                          <p className="text-lg font-bold">{(campaignStats.clicks_count || 0).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{(campaignStats.clicks_rate || 0).toFixed(1)}%</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <UserX className="h-4 w-4 text-red-500" />
                        <div>
                          <p className="text-sm font-medium">Unsubscribes</p>
                          <p className="text-lg font-bold">{(campaignStats.unsubscribes_count || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Performance indicator bar */}
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Performance</span>
                        <span>{(campaignStats.opens_rate || 0).toFixed(1)}% open rate</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            (campaignStats.opens_rate || 0) > 25 ? 'bg-green-500' :
                            (campaignStats.opens_rate || 0) > 15 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min((campaignStats.opens_rate || 0), 100)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                )}

                {!campaignStats && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No statistics available for this campaign
                    </p>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
