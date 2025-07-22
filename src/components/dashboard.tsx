
'use client';

import type { Campaign } from '@/lib/data';
import React, { useState, useEffect } from 'react';
import { LogOut, Loader } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { getCampaigns } from '@/lib/epmailpro';
import { useToast } from '@/hooks/use-toast';
import { CampaignListTable } from '@/components/campaign-list-table';

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const fetchedCampaigns = await getCampaigns();
        
        // The API returns 'created_at' as 'date_added', so we map it here.
        const formattedCampaigns = fetchedCampaigns.map(c => ({
          ...c,
          created_at: c.date_added 
        }));

        setCampaigns(formattedCampaigns);

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast({
          title: 'Failed to load campaigns',
          description: 'Could not fetch campaign data from the EP MailPro API.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  
  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <div className="mr-4 flex">
            <h1 className="text-2xl font-bold text-primary">Email Insights Pro</h1>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <Badge variant="outline" className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Sync Active
            </Badge>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8">
            <section>
              <h2 className="text-xl font-semibold tracking-tight mb-4">All Campaigns</h2>
              <CampaignListTable data={campaigns} />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
