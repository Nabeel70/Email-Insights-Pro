
'use client';

import withAuth from "@/components/with-auth";
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
import { db } from '@/lib/firebase';
import { collection, getDocs, query as firestoreQuery, writeBatch, doc } from "firebase/firestore";
import { getLists, getUnsubscribedSubscribers } from "@/lib/epmailpro";

function UnsubscribesPage() {
  const [unsubscribers, setUnsubscribers] = useState<Subscriber[]>([]);
  const [rawListsData, setRawListsData] = useState<EmailList[]>([]);
  const [rawUnsubscribesData, setRawUnsubscribesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const storeInFirestore = async (collectionName: string, data: any[], idKey: string) => {
    if (!data || data.length === 0) return;
    const batch = writeBatch(db);
    const dataCollection = collection(db, collectionName);
    
    // Optional: Clear existing data for a fresh sync
    const existingDocs = await getDocs(firestoreQuery(dataCollection));
    existingDocs.forEach(doc => batch.delete(doc.ref));

    data.forEach(item => {
      if (item && item[idKey]) {
        const docRef = doc(dataCollection, item[idKey]);
        batch.set(docRef, item, { merge: true });
      }
    });
    await batch.commit();
  };
  
  const fetchFromFirestore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        const unsubscribersQuery = firestoreQuery(collection(db, 'rawUnsubscribes'));
        const listsQuery = firestoreQuery(collection(db, 'rawLists'));

        const [unsubscribersSnapshot, listsSnapshot] = await Promise.all([
            getDocs(unsubscribersQuery),
            getDocs(listsQuery)
        ]);
        
        const unsubscribersData = unsubscribersSnapshot.docs.map(doc => doc.data() as Subscriber);
        const listsData = listsSnapshot.docs.map(doc => doc.data() as EmailList);

        setUnsubscribers(unsubscribersData);
        setRawListsData(listsData);
        setRawUnsubscribesData(unsubscribersData);

    } catch (e: any) {
        console.error("Failed to fetch data from Firestore:", e);
        const errorMessage = e.message || 'Could not fetch data from the database.';
        setError(errorMessage);
        toast({
            title: 'Failed to load data',
            description: errorMessage,
            variant: 'destructive',
        });
    } finally {
        setLoading(false);
    }
  }, [toast]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      // 1. Get all lists from API
      const lists: EmailList[] = await getLists();
      await storeInFirestore('rawLists', lists, 'general.list_uid');

      if (!lists || lists.length === 0) {
        toast({ title: 'Sync complete', description: 'No lists found.' });
        return;
      }
      
      // 2. Fetch unsubscribers for each list from API
      const unsubscriberPromises = lists.map(list => getUnsubscribedSubscribers(list.general.list_uid));
      const unsubscriberResults = await Promise.allSettled(unsubscriberPromises);
      
      const allUnsubscribers: Subscriber[] = unsubscriberResults
        .filter((result): result is PromiseFulfilledResult<Subscriber[]> => result.status === 'fulfilled' && result.value !== null)
        .flatMap(result => result.value);

      // 3. De-duplicate subscribers
      const uniqueSubscribersMap = new Map<string, Subscriber>();
      allUnsubscribers.forEach(sub => {
        if (sub && sub.subscriber_uid) {
          uniqueSubscribersMap.set(sub.subscriber_uid, sub);
        }
      });
      const uniqueSubscribers = Array.from(uniqueSubscribersMap.values());
      
      // 4. Store in Firestore
      await storeInFirestore('rawUnsubscribes', uniqueSubscribers, 'subscriber_uid');

      toast({
          title: 'Sync Successful',
          description: `Synced ${uniqueSubscribers.length} unsubscribers from ${lists.length} lists.`,
      });
      
      // 5. Refresh data from Firestore
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
  }, [fetchFromFirestore, toast]);

  useEffect(() => {
    handleSync();
  }, [handleSync]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const isLoading = loading || syncing;

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
                    <Button variant="default" size="sm" onClick={handleSync} disabled={isLoading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
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
                        <StatCard title="Total Unsubscribes" value={isLoading ? '...' : unsubscribers.length.toLocaleString()} icon={<UserX className="h-4 w-4 text-muted-foreground" />} footer="From last sync" />
                        <StatCard title="Number of Lists" value={isLoading ? '...' : (rawListsData || []).length.toLocaleString()} icon={<List className="h-4 w-4 text-muted-foreground" />} footer="From last sync" />
                    </div>
                </section>
                 <Card>
                    <CardHeader>
                        <CardTitle>All Unsubscribed Users</CardTitle>
                        <CardDescription>This table shows a consolidated list of all users who have unsubscribed from any of your email lists, based on the last successful data sync from Firestore.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                             <div className="flex items-center justify-center h-64">
                                <Loader className="h-8 w-8 animate-spin" />
                                <p className="ml-4 text-muted-foreground">{syncing ? 'Syncing data from the API...' : 'Fetching from database...'}</p>
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

                <Card>
                    <CardHeader>
                        <CardTitle>Raw Lists Data (from Firestore)</CardTitle>
                        <CardDescription>This is the raw data for all lists returned from the last sync, for debugging purposes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted p-4 rounded-md text-xs overflow-auto h-96">
                            {isLoading ? 'Loading...' : JSON.stringify(rawListsData, null, 2)}
                        </pre>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Raw Unsubscribes Data (from Firestore)</CardTitle>
                        <CardDescription>This is the raw data for all unsubscribers returned from the last sync, for debugging purposes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted p-4 rounded-md text-xs overflow-auto h-96">
                             {isLoading ? 'Loading...' : JSON.stringify(rawUnsubscribesData, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
            </div>
        </main>
    </div>
  );
}

export default withAuth(UnsubscribesPage);
