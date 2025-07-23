
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { testFirestoreConnection } from '@/lib/diagnostics';
import { Loader, Server, AlertCircle } from 'lucide-react';

export default function FirestoreDiagnosticsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTestConnection = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const testResult = await testFirestoreConnection();
      setResult(testResult);
    } catch (e: any) {
      setError(e.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8 font-sans">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Server />
            Firestore Connection Diagnostics
          </CardTitle>
          <CardDescription>
            This page tests the server's ability to connect to and perform basic read/write
            operations on your Firestore database using the Admin SDK.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button onClick={handleTestConnection} disabled={isLoading} className="w-full">
            {isLoading ? <Loader className="animate-spin" /> : 'Run Firestore Test'}
          </Button>

          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-md space-y-2">
                <h4 className="font-semibold text-lg flex items-center gap-2">
                    <AlertCircle />
                    Test Failed
                </h4>
                <pre className="text-sm overflow-x-auto whitespace-pre-wrap">{error}</pre>
            </div>
          )}
          
          {result && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-xl font-semibold">Test Results</h3>
                <div className={`p-4 rounded-md ${result.success ? 'bg-green-600/10 text-green-700' : 'bg-destructive/10 text-destructive'}`}>
                    <p className="font-semibold">Status: {result.success ? 'Success' : 'Failure'}</p>
                    <p>{result.message}</p>
                </div>
              {result.details && (
                <div>
                  <h4 className="font-semibold text-lg mb-2">Details</h4>
                  <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
