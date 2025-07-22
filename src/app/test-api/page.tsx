'use client';

import { useState } from 'react';
import { getCampaigns, getCampaignStats } from '@/lib/epmailpro';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader } from 'lucide-react';
import type { Campaign, CampaignStats } from '@/lib/data';

type TestResult = {
  campaign?: Campaign;
  stats?: CampaignStats | null;
  error?: string;
  message?: string;
}

export default function TestApiPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const handleTestApi = async () => {
    setLoading(true);
    setResult(null);
    try {
      const campaigns = await getCampaigns();
      if (campaigns && campaigns.length > 0) {
        const firstCampaign = campaigns[0];
        const stats = await getCampaignStats(firstCampaign.campaign_uid);
        setResult({ campaign: firstCampaign, stats: stats });
      } else {
        setResult({ message: 'No campaigns found to test.' });
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
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Click the button below to call the <code>getCampaigns()</code> function, 
            take the first campaign, and then call <code>getCampaignStats()</code> for that campaign.
            The raw JSON output will be displayed below.
          </p>
          <Button onClick={handleTestApi} disabled={loading}>
            {loading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              'Test API (Campaign & Stats)'
            )}
          </Button>

          {result && (
            <pre className="mt-4 p-4 bg-muted rounded-md overflow-x-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
