'use client';

import { useState } from 'react';
import { getCampaignStats } from '@/lib/epmailpro';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader } from 'lucide-react';
import type { Campaign, CampaignStats } from '@/lib/data';

type TestResult = {
  stats?: CampaignStats | null;
  error?: string;
  message?: string;
}

export default function TestApiPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const campaignUidToTest = 'nc262pysf4a33';

  const handleTestApi = async () => {
    setLoading(true);
    setResult(null);
    try {
      const stats = await getCampaignStats(campaignUidToTest);
      if (stats) {
        setResult({ stats: stats });
      } else {
        setResult({ message: `No stats found for campaign UID: ${campaignUidToTest}` });
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
            Click the button below to call <code>getCampaignStats()</code> for the specific campaign UID <strong>{campaignUidToTest}</strong>.
            The raw JSON output will be displayed below.
          </p>
          <Button onClick={handleTestApi} disabled={loading}>
            {loading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Campaign Stats'
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
