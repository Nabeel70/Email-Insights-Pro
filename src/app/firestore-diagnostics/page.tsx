
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { AuthGuard } from '@/components/auth-guard';


const DIAGNOSTICS_COLLECTION = 'diagnostics';
const DIAGNOSTICS_DOC_ID = 'test-document';

function FirestoreDiagnosticsPageComponent() {
  const [readStatus, setReadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [writeStatus, setWriteStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const runDiagnostics = async () => {
    setError(null);
    setReadStatus('loading');
    setWriteStatus('idle');
    setDeleteStatus('idle');

    // 1. Write Test
    setWriteStatus('loading');
    const testDocRef = doc(db, DIAGNOSTICS_COLLECTION, DIAGNOSTICS_DOC_ID);
    try {
      await setDoc(testDocRef, { 
        message: 'Hello Firestore!', 
        timestamp: serverTimestamp() 
      });
      setWriteStatus('success');
      toast({ title: "Write Test Successful", description: "Successfully wrote a document to Firestore." });

      // 2. Read Test (if write was successful)
      setReadStatus('loading');
      const docSnap = await getDoc(testDocRef);
      if (docSnap.exists()) {
        setReadStatus('success');
        toast({ title: "Read Test Successful", description: `Read back: "${docSnap.data().message}"` });
      } else {
        throw new Error("Document did not exist after writing.");
      }

      // 3. Delete Test (if read was successful)
      setDeleteStatus('loading');
      await deleteDoc(testDocRef);
      setDeleteStatus('success');
      toast({ title: "Delete Test Successful", description: "Successfully cleaned up the test document." });

    } catch (e: any) {
      console.error("Firestore Diagnostics Error:", e);
      const errorMessage = e.message || 'An unknown error occurred.';
      setError(errorMessage);
      
      if (e.code === 'permission-denied') {
        if (writeStatus !== 'success') setWriteStatus('error');
        else if (readStatus !== 'success') setReadStatus('error');
        else setDeleteStatus('error');
        toast({
          title: "Permission Denied",
          description: "Your Firestore security rules are blocking the operation. Ensure authenticated users have read/write access.",
          variant: "destructive"
        });
      } else {
        if (writeStatus !== 'success') setWriteStatus('error');
        if (readStatus !== 'success') setReadStatus('error');
        if (deleteStatus !== 'success') setDeleteStatus('error');
        toast({
          title: "Diagnostics Failed",
          description: errorMessage,
          variant: "destructive"
        });
      }
    }
  };

  const StatusIndicator = ({ status }: { status: 'idle' | 'loading' | 'success' | 'error' }) => {
    switch (status) {
      case 'loading':
        return <Loader className="h-5 w-5 animate-spin text-muted-foreground" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'idle':
      default:
        return <HelpCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Firestore Diagnostics</CardTitle>
          <CardDescription>
            This page tests the connection to your Firestore database and verifies that your security rules allow for basic read/write operations for authenticated users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-md">
              <span className="font-medium">1. Write Document Test</span>
              <StatusIndicator status={writeStatus} />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-md">
              <span className="font-medium">2. Read Document Test</span>
              <StatusIndicator status={readStatus} />
            </div>
             <div className="flex items-center justify-between p-3 border rounded-md">
              <span className="font-medium">3. Delete Document Test</span>
              <StatusIndicator status={deleteStatus} />
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Detected</AlertTitle>
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {writeStatus === 'success' && readStatus === 'success' && deleteStatus === 'success' && (
             <Alert variant="default" className="bg-green-500/10 border-green-500/50 text-green-700">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">All Tests Passed!</AlertTitle>
                <AlertDescription>
                    Your Firestore connection and security rules are configured correctly for basic operations.
                </AlertDescription>
            </Alert>
          )}
          
          <div className="flex gap-4">
            <Button 
                onClick={runDiagnostics} 
                disabled={writeStatus === 'loading' || readStatus === 'loading' || deleteStatus === 'loading'}
                className="w-full"
            >
                {(writeStatus === 'loading' || readStatus === 'loading' || deleteStatus === 'loading') ? (
                    <><Loader className="mr-2 h-4 w-4 animate-spin" /> Running...</>
                ) : 'Run Diagnostics'}
            </Button>
            <Button variant="outline" onClick={() => router.push('/')} className="w-full">
                Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


export default function FirestoreDiagnosticsPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <AuthGuard>
      {isClient ? <FirestoreDiagnosticsPageComponent /> : <div className="flex items-center justify-center min-h-screen"><Loader className="h-8 w-8 animate-spin" /></div>}
    </AuthGuard>
  );
}
