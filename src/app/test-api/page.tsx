'use client';

import { useState } from 'react';
import { getCampaigns, getLists, getCampaignStats } from '@/lib/epmailpro';
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

  const handleGetSpecificCampaignStats = async (campaignUid: string) => {
    setLoading(true);
    setResult(null);
    try {
      const stats = await getCampaignStats(campaignUid);
      setResult({ 
        stats, 
        testedCampaignUid: campaignUid,
        message: stats ? 'Successfully fetched campaign stats' : 'No stats available for this campaign'
      });
    } catch (error) {
      setResult({ error: (error as Error).message });
    } finally {
      setLoading(false);
    }
  }

  const handleFullTest = async () => {
    setLoading(true);
    setResult(null);
    try {
      const campaigns = await getCampaigns();
      if (!campaigns || campaigns.length === 0) {
        setResult({ 
          message: 'No campaigns found. You may need to create campaigns first.',
          campaigns: []
        });
        return;
      }
      
      const campaignToTest = campaigns[0];
      const campaignUidToTest = campaignToTest.campaign_uid;
      
      const stats = await getCampaignStats(campaignUidToTest);
      
      setResult({ 
        testedCampaignUid: campaignUidToTest, 
        stats, 
        campaigns,
        message: stats ? 'Successfully fetched campaign stats' : 'No stats available for this campaign'
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
            Use these buttons to test the connection to the EP MailPro API.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button onClick={() => handleGetSpecificCampaignStats('vm551z0vny5b9')} disabled={loading}>
              {loading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
              Test Real Campaign (vm551z0vny5b9)
            </Button>
            <Button onClick={handleGetCampaigns} disabled={loading} variant="outline">
              {loading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
              Get Campaigns
            </Button>
            
            <Button onClick={handleGetLists} disabled={loading} variant="outline">
              {loading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
              Get Lists
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
            <p className="text-sm font-semibold mb-2">Important:</p>
            <p className="text-sm">
              If the API returns an empty array <code>[]</code>, it is NOT an error. It means:
            </p>
            <ul className="text-sm list-disc list-inside mt-1">
              <li>Your API key is valid and working ✓</li>
              <li>The API endpoints are responding correctly ✓</li>
              <li>But there may be no data (e.g., campaigns) in your account yet.</li>
            </ul>
            <p className="text-sm mt-2">
              <strong>Next steps:</strong> Log into your EP MailPro dashboard and ensure you have created campaigns to see them appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
