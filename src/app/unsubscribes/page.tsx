
'use client';

import { PageWithAuth } from '@/components/page-with-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Subscriber, Campaign } from '@/lib/types';
import { Loader, UserX, RefreshCw, Search, Calendar, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function UnsubscribesPage() {
  return (
    <PageWithAuth>
      <UnsubscribesContent />
    </PageWithAuth>
  );
}

function UnsubscribesContent() {
  const [unsubscribers, setUnsubscribers] = useState<Subscriber[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Filter unsubscribers based on search term
  const filteredUnsubscribers = useMemo(() => {
    if (!searchTerm) return unsubscribers;
    
    return unsubscribers.filter(sub => {
      const email = sub.EMAIL?.toLowerCase() || '';
      const search = searchTerm.toLowerCase();
      return email.includes(search);
    });
  }, [unsubscribers, searchTerm]);

  // Get recent unsubscribes (last 30 days)
  const recentUnsubscribes = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return unsubscribers.filter(sub => {
      if (!sub.date_added) return false;
      const unsubDate = new Date(sub.date_added);
      return unsubDate >= thirtyDaysAgo;
    });
  }, [unsubscribers]);

  const fetchData = async () => {
    try {
      const [unsubscribersSnapshot, campaignsSnapshot] = await Promise.all([
        getDocs(collection(db, 'rawUnsubscribers')), // Corrected collection name
        getDocs(collection(db, 'rawCampaigns'))
      ]);

      const unsubscribersData = unsubscribersSnapshot.docs
        .map(doc => doc.data() as Subscriber)
        .filter(sub => sub.status === 'unsubscribed') // Only unsubscribed users
        .sort((a, b) => {
          const dateA = a.date_added ? new Date(a.date_added).getTime() : 0;
          const dateB = b.date_added ? new Date(b.date_added).getTime() : 0;
          return dateB - dateA; // Most recent first
        });

      const campaignsData = campaignsSnapshot.docs.map(doc => doc.data() as Campaign);

      setUnsubscribers(unsubscribersData);
      setCampaigns(campaignsData);
    } catch (error) {
      console.error('Failed to fetch unsubscribes:', error);
      toast({
        title: 'Failed to load unsubscribes',
        description: 'Could not fetch unsubscribe data from Firestore.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
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
      await fetchData(); // Refresh data after sync
    } catch (error) {
      console.error("Sync error:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({
        title: 'Sync Failed',
        description: `Failed to complete data sync: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Unsubscribes</h1>
          <p className="text-muted-foreground">List unsubscribes from campaigns</p>
        </div>
        <Button onClick={handleSync} disabled={syncing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Data'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Unsubscribes</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unsubscribers.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Unsubscribes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentUnsubscribes.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total campaigns</p>
          </CardContent>
        </Card>
      </div>

      {/* Unsubscribes List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Unsubscribed Users</CardTitle>
              <CardDescription>
                Users who have unsubscribed from email campaigns
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUnsubscribers.length === 0 ? (
            <div className="text-center py-8">
              {unsubscribers.length === 0 ? (
                <>
                  <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No unsubscribes found</h3>
                  <p className="text-muted-foreground mb-4">
                    No unsubscribe data is available. Try syncing data from EP MailPro.
                  </p>
                  <Button onClick={handleSync} disabled={syncing}>
                    {syncing ? 'Syncing...' : 'Sync Unsubscribes'}
                  </Button>
                </>
              ) : (
                <>
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No results found</h3>
                  <p className="text-muted-foreground">
                    No unsubscribes match your search term "{searchTerm}"
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Unsubscribed</TableHead>
                    <TableHead>Subscriber ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUnsubscribers.map((subscriber) => (
                    <TableRow key={subscriber.subscriber_uid}>
                      <TableCell className="font-medium">
                        {subscriber.EMAIL || 'No email provided'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={subscriber.status === 'unsubscribed' ? 'destructive' : 'secondary'}
                        >
                          {subscriber.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(subscriber.date_added)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {subscriber.subscriber_uid}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination info */}
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredUnsubscribers.length} of {unsubscribers.length} unsubscribes
                </div>
                <div className="text-sm text-muted-foreground">
                  {searchTerm && `Filtered by: "${searchTerm}"`}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
