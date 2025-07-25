
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LogOut, Loader, Home, AlertCircle, UserX, List, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { Subscriber, EmailList } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UnsubscribeDataTable } from "@/components/unsubscribe-data-table";
import { StatCard } from "@/components/stat-card";
import { db } from "@/lib/firebase";
import { collection, getDocs, query as firestoreQuery } from 'firebase/firestore';
import { AuthGuard } from '@/components/auth-guard';

function UnsubscribesPageContent() {
  const router = useRouter();

  const [unsubscribers, setUnsubscribers] = useState<Subscriber[]>([]);
  const [rawListsData, setRawListsData] = useState<EmailList[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const fetchFromFirestore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        const listsCollection = collection(db, 'rawLists');
        const unsubscribesCollection = collection(db, 'rawUnsubscribes');

        const listsSnapshot = await getDocs(firestoreQuery(listsCollection));
        const unsubscribesSnapshot = await getDocs(firestoreQuery(unsubscribesCollection));

        const lists = listsSnapshot.docs.map(doc => doc.data() as EmailList);
        let unsubscribers = unsubscribesSnapshot.docs.map(doc => doc.data() as Subscriber);

        // Sort by date, newest first
        unsubscribers.sort((a, b) => {
            const dateA = a.date_added ? new Date(a.date_added).getTime() : 0;
            const dateB = b.date_added ? new Date(b.date_added).getTime() : 0;
            return dateB - dateA;
        });
        
        setRawListsData(lists);
        setUnsubscribers(unsubscribers);

    } catch (e: any) {
        console.error("Failed to fetch data from Firestore:", e);
        const errorMessage = e.message || 'Could not fetch data from Firestore.';
        setError(errorMessage);
        toast({
            title: 'Failed to Load Data',
            description: errorMessage,
            variant: 'destructive',
        });
    } finally {
        setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFromFirestore();
  }, [fetchFromFirestore]);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const response = await fetch('/api/manual-sync', { method: 'GET' });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Sync failed due to server error.');
      }

      toast({
        title: 'Sync Successful',
        description: result.message,
      });
      // Re-fetch data from Firestore to update the UI
      await fetchFromFirestore();
    } catch (e: any) {
      console.error("Sync failed:", e);
      const errorMessage = e.message || 'Could not sync data from the API.';
      setError(errorMessage);
      toast({
        title: 'Sync Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };


  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
                <div className="mr-4 flex">
                    <h1 className="text-2xl font-bold text-primary">Email Insights Pro</h1>
                </div>
                <div className="flex flex-1 items-center justify-end space-x-2">
                     <Button variant="outline" size="sm" onClick={() => router.push('/')}>
                        <Home className="mr-2 h-4 w-4" />
                        Dashboard
                    </Button>
                    <Button variant="default" size="sm" onClick={handleSync} disabled={syncing || loading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${syncing || loading ? 'animate-spin' : ''}`} />
                        {syncing ? 'Syncing...' : 'Sync Unsubscribes'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </Button>
                </div>
            </div>
        </header>

        <main className="flex-1">
            <div className="container py-8 px-4 sm:px-6 lg:px-8 space-y-8">
                <section>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <StatCard title="Total Unsubscribes" value={loading ? '...' : unsubscribers.length.toLocaleString()} icon={<UserX className="h-4 w-4 text-muted-foreground" />} footer="From last sync" />
                        <StatCard title="Number of Lists" value={loading ? '...' : (rawListsData || []).length.toLocaleString()} icon={<List className="h-4 w-4 text-muted-foreground" />} footer="From last sync" />
                    </div>
                </section>
                 <Card>
                    <CardHeader>
                        <CardTitle>All Unsubscribed Users</CardTitle>
                        <CardDescription>This table shows a consolidated list of all users who have unsubscribed from any of your email lists, based on the last successful data sync from Firestore.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading && !syncing ? (
                             <div className="flex items-center justify-center h-64">
                                <Loader className="h-8 w-8 animate-spin" />
                                <p className="ml-4 text-muted-foreground">Fetching data from database...</p>
                            </div>
                        ) : error ? (
                            <div className="bg-destructive/10 text-destructive p-4 rounded-md space-y-2">
                                <h4 className="font-semibold text-lg flex items-center gap-2">
                                    <AlertCircle />
                                    Could not load data
                                </h4>
                                <pre className="text-sm overflow-x-auto whitespace-pre-wrap">{error}</pre>
                            </div>
                        ) : (
                           <UnsubscribeDataTable data={unsubscribers} />
                        )}
                    </CardContent>
                 </Card>
            </div>
        </main>
    </div>
  );
}


export default function UnsubscribesPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <AuthGuard>
      {isClient ? <UnsubscribesPageContent /> : null}
    </AuthGuard>
  );
}
