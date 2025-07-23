
'use server';

import { NextResponse } from 'next/server';
import { getCampaigns, getCampaignStats } from '@/lib/epmailpro';
import { storeRawCampaigns, storeRawStats } from '@/lib/sync';

async function performSync() {
  const campaigns = await getCampaigns();
  if (campaigns.length === 0) {
    return { success: true, message: 'No campaigns to sync.', campaignsCount: 0, statsCount: 0 };
  }

  const statsPromises = campaigns.map(c => getCampaignStats(c.campaign_uid));
  const statsResults = await Promise.allSettled(statsPromises);
  
  const successfulStats = statsResults
    .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled' && result.value)
    .map(result => result.value);

  // Now, store the raw data in Firestore
  await storeRawCampaigns(campaigns);
  await storeRawStats(successfulStats);
  
  return { 
    success: true, 
    message: `Sync complete. Stored ${campaigns.length} campaigns and ${successfulStats.length} stats records.`,
    campaignsCount: campaigns.length,
    statsCount: successfulStats.length,
  };
}

// The GET route is used for both scheduled jobs and manual syncs from the dashboard.
export async function GET() {
  try {
    const result = await performSync();
    return NextResponse.json(result);
  } catch (error) {
    console.error('API route error during scheduled GET sync:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: `Failed to complete data sync: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// The POST route is no longer used for this flow, but can be kept for other potential uses.
// For now, it will do nothing.
export async function POST() {
    return NextResponse.json({ message: 'This endpoint is not configured for POST requests.' }, { status: 405 });
}
