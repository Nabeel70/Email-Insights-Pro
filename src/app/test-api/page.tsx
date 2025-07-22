'use client';

import { useState } from 'react';
import { getCampaigns, getLists, getCampaignStats, exploreApi } from '@/lib/epmailpro';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader } from 'lucide-react';
import type { Campaign, CampaignStats } from '@/lib/data';

type TestResult = {
  campaigns?: Campaign[];
  lists?: any[];
  stats?: CampaignStats | null;
  error?: string;
  message?: string;
  testedCampaignUid?: string;
  apiExploration?: any;
}

export default function TestApiPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const handleGetCampaigns = async () => {
    setLoading(true);
    setResult(null);
    try {
      const campaigns = await getCampaigns();
      setResult({ 
        campaigns, 
        message: campaigns.length > 0 
          ? `Found ${campaigns.length} campaigns` 
          : 'No campaigns found (empty array returned)'
      });
    } catch (error) {
      setResult({ error: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleGetLists = async () => {
    setLoading(true);
    setResult(null);
    try {
      const lists = await getLists();
      setResult({ 
        lists, 
        message: lists.length > 0 
          ? `Found ${lists.length} lists` 
          : 'No lists found'
      });
    } catch (error) {
      setResult({ error: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleExploreApi = async () => {
    setLoading(true);
    setResult(null);
    try {
      const exploration = await exploreApi();
      setResult({ 
        apiExploration: exploration,
        message: 'Explored various API endpoints'
      });
    } catch (error) {
      setResult({ error: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleFullTest = async () => {
    setLoading(true);
    setResult(null);
    try {
      // 1. First get lists to understand the structure
      const lists = await getLists();
      
      // 2. Get campaigns
      const campaigns = await getCampaigns();
      
      if (!campaigns || campaigns.length === 0) {
        setResult({ 
          message: 'No campaigns found. You may need to create campaigns first.',
          lists,
          campaigns: []
        });
        return;
      }
      
      // 3. Get stats for the first campaign
      const campaignToTest = campaigns[0];
      const campaignUidToTest = campaignToTest.campaign_uid;
      
      const stats = await getCampaignStats(campaignUidToTest);
      
      setResult({ 
        testedCampaignUid: campaignUidToTest, 
        stats, 
        campaigns,
        lists,
        message: stats ? 'Successfully fetched campaign stats' : 'No stats available'
      });
    } catch (error) {
      setResult({ error: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>EP MailPro API Test Page</CardTitle>
          <CardDescription>
            Test the API using the query parameter format that works.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-green-50 rounded-md">
            <p className="text-sm text-green-800">
              ✅ API connection verified! Using format: <code>?endpoint=campaigns</code>
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <Button onClick={handleGetCampaigns} disabled={loading} variant="outline">
              {loading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
              Get Campaigns
            </Button>
            
            <Button onClick={handleGetLists} disabled={loading} variant="outline">
              {loading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
              Get Lists
            </Button>
            
            <Button onClick={handleExploreApi} disabled={loading} variant="outline">
              {loading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
              Explore API
            </Button>
            
            <Button onClick={handleFullTest} disabled={loading}>
              {loading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
              Run Full Test
            </Button>
          </div>

          {result && (
            <>
              {result.message && (
                <p className="mb-2 text-sm font-medium">{result.message}</p>
              )}
              {result.testedCampaignUid && (
                <p className="mb-2 text-sm">
                  Testing stats for Campaign UID: <strong>{result.testedCampaignUid}</strong>
                </p>
              )}
              <pre className="mt-2 p-4 bg-muted rounded-md overflow-x-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </>
          )}
          
          <div className="mt-4 p-4 bg-yellow-50 rounded-md">
            <p className="text-sm font-semibold mb-2">Note:</p>
            <p className="text-sm">
              The API returns an empty array <code>[]</code> which might mean:
            </p>
            <ul className="text-sm list-disc list-inside mt-1">
              <li>No campaigns have been created yet</li>
              <li>Additional parameters are needed (like list_uid)</li>
              <li>The account needs to be set up first</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
