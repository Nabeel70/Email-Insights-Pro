
'use client';

import withAuth from "@/components/with-auth";
import React, { useState, useEffect, useCallback } from 'react';
import { LogOut, Loader, Home, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { EmailList, Subscriber } from '@/lib/types';
import { getLists, getSubscribers, getSubscriber } from '@/lib/epmailpro';
import { UnsubscribeDataTable } from '@/components/unsubscribe-data-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function UnsubscribesPage() {
  const [unsubscribes, setUnsubscribes] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const fetchAllUnsubscribes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const lists: EmailList[] = await getLists();
      if (!lists || lists.length === 0) {
        setUnsubscribes([]);
        setLoading(false); // Ensure loading is stopped
        return;
      }
      
      const subscriberPromises = lists.map(list => getSubscribers(list.general.list_uid));
      const results = await Promise.allSettled(subscriberPromises);

      const allSubscriberSummaries: Subscriber[] = results
        .filter((result): result is PromiseFulfilledResult<Subscriber[]> => result.status === 'fulfilled' && result.value !== null)
        .flatMap(result => result.value);
      
      if (allSubscriberSummaries.length === 0) {
        setUnsubscribes([]);
        setLoading(false); // Ensure loading is stopped
        return;
      }

      // Now fetch the full details for each subscriber to get their email
      const detailedSubscriberPromises = allSubscriberSummaries.map(sub => getSubscriber(sub.subscriber_uid));
      const detailedResults = await Promise.allSettled(detailedSubscriberPromises);
      
      const allSubscribers = detailedResults
        .filter((result): result is PromiseFulfilledResult<Subscriber | null> => result.status === 'fulfilled' && result.value !== null)
        .map(result => result.value as Subscriber);

      // Deduplicate subscribers by email
      const uniqueSubscribers = Array.from(new Map(allSubscribers.map(sub => [sub.fields?.EMAIL, sub])).values());
      
      setUnsubscribes(uniqueSubscribers);

    } catch (e: any) {
        console.error("Failed to fetch unsubscribes:", e);
        setError(e.message || 'Could not fetch unsubscribe data.');
        toast({
            title: 'Failed to load unsubscribes',
            description: (e as Error).message || 'Could not fetch unsubscribe data.',
            variant: 'destructive',
        });
    } finally {
        setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAllUnsubscribes();
  }, [fetchAllUnsubscribes]);

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
            <div className="container py-8 px-4 sm:px-6 lg:px-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>All Unsubscribed Users</CardTitle>
                        <CardDescription>This is a master list of all users who have unsubscribed from any of your email lists. The list is deduplicated by email address.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                             <div className="flex items-center justify-center h-64">
                                <Loader className="h-8 w-8 animate-spin" />
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
                           <UnsubscribeDataTable data={unsubscribes} />
                        )}
                    </CardContent>
                 </Card>
            </div>
        </main>
    </div>
  );
}

export default withAuth(UnsubscribesPage);
