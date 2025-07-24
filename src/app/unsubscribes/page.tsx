
'use client';

import withAuth from "@/components/with-auth";
import React, { useState, useEffect, useCallback } from 'react';
import { LogOut, Loader, Home, AlertCircle, UserX, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { Subscriber, EmailList } from '@/lib/types';
import { getLists, getUnsubscribedSubscribers } from '@/lib/epmailpro';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UnsubscribeDataTable } from "@/components/unsubscribe-data-table";
import { StatCard } from "@/components/stat-card";

function UnsubscribesPage() {
  const [unsubscribers, setUnsubscribers] = useState<Subscriber[]>([]);
  const [rawApiData, setRawApiData] = useState<any>({});
  const [rawListsData, setRawListsData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const fetchAllUnsubscribers = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUnsubscribers([]);
    const rawDataAccumulator: any = {};

    try {
      // 1. Get all lists
      const listsResult = await getLists();
      setRawListsData(listsResult); 
      
      const lists: EmailList[] = Array.isArray(listsResult) ? listsResult : [];
      
      rawDataAccumulator.listsResponse = listsResult;

      if (!lists || lists.length === 0) {
        setRawApiData({ status: 'No lists found or returned from API.' });
        setLoading(false);
        return;
      }
      
      rawDataAccumulator.lists = lists;

      // 2. Fetch unsubscribers for each list
      const unsubscriberPromises = lists.map(list => 
        getUnsubscribedSubscribers(list.general.list_uid).then(result => ({
            list_uid: list.general.list_uid,
            result
        }))
      );
      const unsubscriberResults = await Promise.allSettled(unsubscriberPromises);
      
      rawDataAccumulator.unsubscriberResponses = unsubscriberResults;

      const allUnsubscribers: Subscriber[] = unsubscriberResults
        .filter((result): result is PromiseFulfilledResult<{ list_uid: string; result: Subscriber[] }> => result.status === 'fulfilled' && result.value.result !== null)
        .flatMap(result => result.value.result);

      // 3. De-duplicate subscribers
      const uniqueSubscribers = new Map<string, Subscriber>();
      allUnsubscribers.forEach(sub => {
        if (sub && sub.subscriber_uid && !uniqueSubscribers.has(sub.subscriber_uid)) {
          uniqueSubscribers.set(sub.subscriber_uid, sub);
        }
      });
      
      setUnsubscribers(Array.from(uniqueSubscribers.values()));

    } catch (e: any) {
        console.error("Failed to fetch unsubscribers:", e);
        const errorMessage = e.message || 'Could not fetch unsubscribe data.';
        setError(errorMessage);
        rawDataAccumulator.error = { message: errorMessage, stack: e.stack };
        toast({
            title: 'Failed to load data',
            description: errorMessage,
            variant: 'destructive',
        });
    } finally {
        setRawApiData(rawDataAccumulator);
        setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAllUnsubscribers();
  }, [fetchAllUnsubscribers]);

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
                        <StatCard title="Total Unsubscribes" value={unsubscribers.length.toLocaleString()} icon={<UserX className="h-4 w-4 text-muted-foreground" />} footer="Across all lists" />
                        <StatCard title="Number of Lists" value={(rawListsData || []).length.toLocaleString()} icon={<List className="h-4 w-4 text-muted-foreground" />} footer="Fetched from API" />
                    </div>
                </section>
                 <Card>
                    <CardHeader>
                        <CardTitle>All Unsubscribed Users</CardTitle>
                        <CardDescription>This table shows a consolidated list of all users who have unsubscribed from any of your email lists. The data is exportable in various formats.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                             <div className="flex items-center justify-center h-64">
                                <Loader className="h-8 w-8 animate-spin" />
                                <p className="ml-4 text-muted-foreground">Fetching all unsubscribers from all lists...</p>
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
                        <CardTitle>Raw API Call for All Lists</CardTitle>
                        <CardDescription>This is the raw data returned from the initial `getLists` API call for debugging purposes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted p-4 rounded-md text-xs overflow-auto h-96">
                            {JSON.stringify(rawListsData, null, 2)}
                        </pre>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Raw API Data (Full Process)</CardTitle>
                        <CardDescription>This is the raw data returned from the entire unsubscribe fetching process for debugging purposes. This box will appear even if the data is empty.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted p-4 rounded-md text-xs overflow-auto h-96">
                            {JSON.stringify(rawApiData, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
            </div>
        </main>
    </div>
  );
}

export default withAuth(UnsubscribesPage);
