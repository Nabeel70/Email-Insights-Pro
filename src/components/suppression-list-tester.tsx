
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { testSuppressionListEndpoints } from '@/lib/epmailpro';
import { Loader, AlertCircle, CheckCircle } from 'lucide-react';

type TestResult = {
    endpoint: string;
    status: 'success' | 'failed';
    response?: any;
    error?: string;
    statusCode?: number;
};

export function SuppressionListTester() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const handleRunTests = async () => {
    if (!email) {
      alert('Please enter an email address.');
      return;
    }
    setIsLoading(true);
    setResults([]);
    const testResults = await testSuppressionListEndpoints(email);
    setResults(testResults);
    setIsLoading(false);
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Suppression List Endpoint Tester</CardTitle>
        <CardDescription>
          This tool will attempt to add an email to the suppression list `rg591800s2a2c` using several possible API endpoint variations to find the one that works.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="suppression-email">Email Address</Label>
          <Input
            id="suppression-email"
            type="email"
            placeholder="example@test.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <Button onClick={handleRunTests} disabled={isLoading || !email}>
          {isLoading ? <Loader className="animate-spin" /> : 'Run All Tests'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-xl font-semibold">Test Results</h3>
            {results.map((result, index) => (
              <div key={index} className={`p-4 rounded-md ${result.status === 'success' ? 'bg-green-600/10' : 'bg-destructive/10'}`}>
                <h4 className={`font-semibold text-lg flex items-center gap-2 mb-2 ${result.status === 'success' ? 'text-green-700' : 'text-destructive'}`}>
                  {result.status === 'success' ? <CheckCircle /> : <AlertCircle />}
                  Test {index + 1}: POST /{result.endpoint}
                </h4>
                <div className="text-sm">
                  <p><span className="font-semibold">Status:</span> {result.status === 'success' ? 'Success' : `Failed (Status ${result.statusCode || 'N/A'})`}</p>
                  {result.error && <p><span className="font-semibold">Error:</span> {result.error}</p>}
                  {result.response && (
                    <div className="mt-2">
                      <p className="font-semibold">Response:</p>
                      <pre className="bg-muted p-2 rounded-md text-xs overflow-auto mt-1">
                        {JSON.stringify(result.response, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
