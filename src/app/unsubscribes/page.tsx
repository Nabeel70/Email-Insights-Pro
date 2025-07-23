
'use client';

import withAuth from "@/components/with-auth";
import React, { useState, useEffect, useCallback } from 'react';
import { LogOut, Loader, Home, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { EmailList } from '@/lib/types';
import { makeApiRequest } from '@/lib/epmailpro';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function UnsubscribesPage() {
  const [lists, setLists] = useState<EmailList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const fetchLists = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLists([]);
    try {
      // Pass undefined for the params argument to ensure no query string is added
      const { data } = await makeApiRequest('GET', 'lists', undefined);
      setLists(data || []);
    } catch (e: any) {
        console.error("Failed to fetch lists:", e);
        setError(e.message || 'Could not fetch email list data.');
        toast({
            title: 'Failed to load lists',
            description: (e as Error).message || 'Could not fetch email list data.',
            variant: 'destructive',
        });
    } finally {
        setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

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
                        <CardTitle>Raw Email List Data</CardTitle>
                        <CardDescription>This panel shows the raw data for all email lists fetched from the API. This is the first step to getting all unsubscribes.</CardDescription>
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
                           <pre className="bg-muted p-4 rounded-md text-xs overflow-auto h-96">
                            {lists.length > 0 ? JSON.stringify(lists, null, 2) : "No lists found or returned by the API."}
                           </pre>
                        )}
                    </CardContent>
                 </Card>
            </div>
        </main>
    </div>
  );
}

export default withAuth(UnsubscribesPage);
