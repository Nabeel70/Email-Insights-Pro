
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader, Server, AlertCircle } from 'lucide-react';
import { collection, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';

export default function FirestoreDiagnosticsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTestConnection = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      setError('Test failed: No authenticated user found. Please log in again.');
      setIsLoading(false);
      return;
    }

    const docId = `test-${user.uid}-${Date.now()}`;
    const docRef = doc(db, 'diagnostics', docId);
    const testData = {
      timestamp: new Date(),
      status: 'ok',
      message: `Test document written by user ${user.uid}.`,
      userId: user.uid,
    };

    try {
      // 1. Write Operation
      await setDoc(docRef, testData);

      // 2. Read Operation
      const snapshot = await getDoc(docRef);
      const data = snapshot.data();

      // 3. Delete Operation
      await deleteDoc(docRef);
      
      if (!snapshot.exists() || !data) {
          throw new Error('Read operation failed. Document not found after writing.');
      }
      
      if (data.status !== 'ok' || data.userId !== user.uid) {
          throw new Error('Data mismatch. Read data does not match written data.');
      }

      setResult({
        success: true,
        message: 'Successfully connected to Firestore and performed write, read, and delete operations as an authenticated client.',
        details: {
          written: testData,
          read: data,
          deleted: true
        },
      });

    } catch (e: any) { {
      console.error('Firestore client diagnostics test failed:', e);
      const errorMessage = e.message || 'An unknown error occurred';
      
      if (errorMessage.toLowerCase().includes('permission-denied') || errorMessage.toLowerCase().includes('permission_denied')) {
          setError(
              'Firestore Permission Denied. This means your Firestore security rules are blocking this action. Please ensure your rules allow authenticated users to write to the "diagnostics" collection. Example: `match /diagnostics/{docId} { allow write: if request.auth.uid == resource.data.userId; }`'
          );
      } else {
        setError(`Firestore diagnostics failed: ${errorMessage}`);
      }
    }
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
            This page tests the browser's ability to connect to and perform basic read/write
            operations on your Firestore database as an authenticated user.
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
