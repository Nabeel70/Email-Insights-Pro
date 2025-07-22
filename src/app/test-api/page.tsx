'use client';

import { useState } from 'react';
import { getCampaigns, getCampaignStats } from '@/lib/epmailpro';
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
}

export default function TestApiPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const handleTestApi = async () => {
    setLoading(true);
    setResult(null);
    try {
      // 1. Fetch campaigns from the specified list
      const campaigns = await getCampaigns();
      if (!campaigns || campaigns.length === 0) {
        setResult({ message: 'No campaigns found for the specified list.' });
        return;
      }
      
      const campaignToTest = campaigns[0];
      const campaignUidToTest = campaignToTest.campaign_uid;
      
      // 2. Fetch stats for the first campaign found
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
          <CardTitle>API Test Page</CardTitle>
          <CardDescription>
            Click the button below to fetch all campaigns from the list and then call <code>getCampaignStats()</code> for the first campaign found. The raw JSON output or error will be displayed below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleTestApi} disabled={loading}>
            {loading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              'Run Dynamic API Test'
            )}
          </Button>

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
        </CardContent>
      </Card>
    </div>
  );
}
