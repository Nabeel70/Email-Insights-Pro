'use client';

import { useState } from 'react';
import { runApiDiagnostics } from '@/lib/epmailpro';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle } from 'lucide-react';

type DiagnosticResult = {
    testName: string;
    url: string;
    headers: Record<string, string>;
    status: 'success' | 'failure';
    httpStatus?: number;
    responseBody: any;
};

export default function TestApiPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunDiagnostics = async () => {
    setLoading(true);
    setResults(null);
    setError(null);
    try {
      const diagnosticResults = await runApiDiagnostics();
      setResults(diagnosticResults);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getWorkingCombination = () => {
    if (!results) return null;
    return results.find(r => r.status === 'success');
  }

  const workingCombination = getWorkingCombination();

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>API Connection Diagnostics</CardTitle>
          <CardDescription>
            This tool systematically tests different API URL formats and authentication headers
            to determine the correct way to connect to the EP MailPro API.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center">
            <Button onClick={handleRunDiagnostics} disabled={loading} size="lg">
              {loading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
              Run Full API Diagnostics
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-6">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Error Running Diagnostics</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {results && (
            <div className="mt-6">
              {workingCombination ? (
                 <Alert variant="default" className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Success! A Working Combination Was Found</AlertTitle>
                    <AlertDescription className="text-green-700">
                        <p>The application can now be configured to use this method.</p>
                        <div className="mt-2 text-xs p-2 bg-green-100 rounded">
                            <p><strong>URL Format:</strong> {workingCombination.url.includes('?endpoint=') ? 'Query Parameter' : 'Path-based'}</p>
                            <p><strong>Header:</strong> {Object.keys(workingCombination.headers).find(h => h.toLowerCase().startsWith('x-')) || 'Authorization'}</p>
                        </div>
                    </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>No Working Combination Found</AlertTitle>
                    <AlertDescription>None of the tested methods resulted in a successful API connection. Please double-check the API key in your .env file.</AlertDescription>
                </Alert>
              )}


              <h3 className="text-lg font-semibold mt-6 mb-2">Detailed Test Results:</h3>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <Card key={index} className={result.status === 'success' ? 'border-green-400' : 'border-red-400'}>
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">{result.testName}</CardTitle>
                         <Badge variant={result.status === 'success' ? 'default' : 'destructive'} className={result.status === 'success' ? 'bg-green-600' : ''}>
                          {result.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                      <p><strong>URL:</strong> <code className="bg-muted p-1 rounded">{result.url}</code></p>
                      <p className="mt-2"><strong>HTTP Status:</strong> {result.httpStatus || 'N/A'}</p>
                      <p className="mt-2"><strong>Headers Sent:</strong></p>
                      <pre className="mt-1 p-2 bg-muted rounded-md overflow-x-auto">
                        {JSON.stringify(result.headers, null, 2)}
                      </pre>
                      <p className="mt-2"><strong>Response Body:</strong></p>
                      <pre className="mt-1 p-2 bg-muted rounded-md overflow-x-auto max-h-40">
                        {typeof result.responseBody === 'string' ? result.responseBody : JSON.stringify(result.responseBody, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
