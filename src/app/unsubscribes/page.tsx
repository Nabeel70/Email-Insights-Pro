
'use client';

import withAuth from "@/components/with-auth";
import React, { useState, useEffect, useCallback } from 'react';
import { LogOut, Loader, Home, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { Subscriber } from '@/lib/types';
import { getLists, getUnsubscribedSubscribers, getSubscriber } from '@/lib/epmailpro';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UnsubscribeDataTable } from "@/components/unsubscribe-data-table";

function UnsubscribesPage() {
  const [unsubscribers, setUnsubscribers] = useState<Subscriber[]>([]);
  const [rawApiData, setRawApiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const fetchAllUnsubscribers = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUnsubscribers([]);
    setRawApiData(null);
    try {
      const { data: lists } = await getLists();
      if (!lists || lists.length === 0) {
        setLoading(false);
        return;
      }
      
      const unsubscriberSummariesPromises = lists.map(list => getUnsubscribedSubscribers(list.general.list_uid));
      const summaryResults = await Promise.allSettled(unsubscriberSummariesPromises);

      const allSummaries = summaryResults
        .filter((result): result is PromiseFulfilledResult<Subscriber[]> => result.status === 'fulfilled' && result.value !== null)
        .flatMap(result => result.value);
      
      const detailedSubscriberPromises = allSummaries.map(sub => getSubscriber(sub.subscriber_uid));
      const detailedResults = await Promise.allSettled(detailedSubscriberPromises);

      const allUnsubscribers = detailedResults
        .filter((result): result is PromiseFulfilledResult<Subscriber | null> => result.status === 'fulfilled' && result.value !== null)
        .map(result => result.value as Subscriber);
      
      setRawApiData({
        lists,
        summaryResults,
        detailedResults,
        finalUnsubscribers: allUnsubscribers
      });

      const uniqueSubscribers = new Map<string, Subscriber>();
      allUnsubscribers.forEach(sub => {
        if (!uniqueSubscribers.has(sub.subscriber_uid)) {
          uniqueSubscribers.set(sub.subscriber_uid, sub);
        }
      });
      
      setUnsubscribers(Array.from(uniqueSubscribers.values()));

    } catch (e: any) {
        console.error("Failed to fetch unsubscribers:", e);
        const errorMessage = e.message || 'Could not fetch unsubscribe data.';
        setError(errorMessage);
        setRawApiData({ error: errorMessage, stack: e.stack });
        toast({
            title: 'Failed to load data',
            description: errorMessage,
            variant: 'destructive',
        });
    } finally {
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

                 {rawApiData && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Raw API Data</CardTitle>
                            <CardDescription>This is the raw data returned from the API for debugging purposes.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <pre className="bg-muted p-4 rounded-md text-xs overflow-auto h-96">
                                {JSON.stringify(rawApiData, null, 2)}
                            </pre>
                        </CardContent>
                    </Card>
                 )}
            </div>
        </main>
    </div>
  );
}

export default withAuth(UnsubscribesPage);
