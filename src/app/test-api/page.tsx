'use client';

import { useState } from 'react';
import { getCampaigns, getCampaignStats, getCampaignsWithParams, testRawApiCall, testUrlVariations } from '@/lib/epmailpro';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader } from 'lucide-react';
import type { Campaign, CampaignStats } from '@/lib/data';

type TestResult = {
  campaigns?: Campaign[];
  stats?: CampaignStats | null;
  error?: string;
  message?: string;
  testedCampaignUid?: string;
  apiTest?: any;
}

export default function TestApiPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const handleTestRawApi = async () => {
    setLoading(true);
    setResult(null);
    try {
      const testResult = await testRawApiCall();
      setResult({ apiTest: testResult });
    } catch (error) {
      setResult({ error: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleTestUrlVariations = async () => {
    setLoading(true);
    setResult(null);
    try {
      const testResults = await testUrlVariations();
      setResult({ apiTest: testResults });
    } catch (error) {
      setResult({ error: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleTestBasicApi = async () => {
    setLoading(true);
    setResult(null);
    try {
      // Test without any query parameters
      const campaigns = await getCampaigns();
      setResult({ campaigns, message: 'Successfully fetched campaigns without query parameters' });
    } catch (error) {
      setResult({ error: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleTestPaginationApi = async () => {
    setLoading(true);
    setResult(null);
    try {
      // Test with pagination
      const campaigns = await getCampaignsWithParams(1, 10);
      setResult({ campaigns, message: 'Successfully fetched campaigns with pagination' });
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
      // 1. Fetch campaigns using the correct function that includes the list_uid
      const campaigns = await getCampaignsWithParams(1, 100);
      if (!campaigns || campaigns.length === 0) {
        setResult({ message: 'No campaigns found for the specified list.' });
        return;
      }
      
      const campaignToTest = campaigns[0];
      const campaignUidToTest = campaignToTest.campaign_uid;
      
      // 2. Fetch stats for the first campaign
      const stats = await getCampaignStats(campaignUidToTest);
      
      if (stats) {
        setResult({ testedCampaignUid: campaignUidToTest, stats: stats, campaigns });
      } else {
        setResult({ testedCampaignUid: campaignUidToTest, message: `No stats found for campaign UID: ${campaignUidToTest}`, campaigns });
      }
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
            Debug your API connection and test different endpoints. Check the browser console for detailed logs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleTestRawApi} disabled={loading} variant="outline">
              {loading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
              Test Raw API Call
            </Button>
            
            <Button onClick={handleTestUrlVariations} disabled={loading} variant="outline">
              {loading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
              Test URL Variations
            </Button>
            
            <Button onClick={handleTestBasicApi} disabled={loading} variant="outline">
              {loading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
              Test Basic Campaigns
            </Button>
            
            <Button onClick={handleTestPaginationApi} disabled={loading} variant="outline">
              {loading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
              Test With Pagination
            </Button>
            
            <Button onClick={handleFullTest} disabled={loading}>
              {loading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
              Run Full Test
            </Button>
          </div>

          {result && (
            <>
              {result.testedCampaignUid && (
                <p className="mt-4 text-sm">
                  Testing stats for Campaign UID: <strong>{result.testedCampaignUid}</strong>
                </p>
              )}
              <pre className="mt-2 p-4 bg-muted rounded-md overflow-x-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </>
          )}
          
          <div className="mt-4 p-4 bg-muted rounded-md">
            <p className="text-sm font-semibold mb-2">Debugging Tips:</p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Check the browser console (F12) for detailed API logs</li>
              <li>Verify your API key is set in <code>.env</code> with the name <code>EP_MAIL_PRO_API_KEY</code></li>
              <li>Try the "Test Raw API Call" or "Test URL Variations" buttons first</li>
              <li>The "Full Test" uses list_uid <code>ln97199d41cc3</code></li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
