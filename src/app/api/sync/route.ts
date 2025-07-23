'use server';

import { storeDailyData } from '@/lib/sync';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { DailyReport } from '@/lib/data';

export async function POST(req: NextRequest) {
  try {
    const reports: DailyReport[] = await req.json();

    if (!reports || !Array.isArray(reports) || reports.length === 0) {
      return NextResponse.json({ error: 'No reports data provided.' }, { status: 400 });
    }

    const result = await storeDailyData(reports);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
  } catch (error) {
    console.error('API route error during sync:', error);
    // Check if the error is due to JSON parsing
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to complete data sync.' },
      { status: 500 }
    );
  }
}

// Keep the GET route for scheduled jobs, but have it do a full sync
export async function GET() {
  try {
    // Re-implement the full sync logic here for the scheduled job
    const { getCampaigns, getCampaignStats } = await import('@/lib/epmailpro');
    const { generateDailyReport } = await import('@/lib/reporting');
    const { storeDailyData } = await import('@/lib/sync');

    const campaigns = await getCampaigns();
    if (campaigns.length === 0) {
      return NextResponse.json({ success: true, message: 'No campaigns to sync.', reportsCount: 0 });
    }

    const statsPromises = campaigns.map(c => getCampaignStats(c.campaign_uid));
    const statsResults = await Promise.allSettled(statsPromises);
    
    const successfulStats = statsResults
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled' && result.value)
      .map(result => result.value);

    const dailyReports = generateDailyReport(campaigns, successfulStats);

    if (dailyReports.length === 0) {
        return NextResponse.json({ success: true, message: 'No processable reports generated.', reportsCount: 0 });
    }

    const result = await storeDailyData(dailyReports);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
  } catch (error) {
    console.error('API route error during scheduled GET sync:', error);
    return NextResponse.json(
      { error: 'Failed to complete scheduled data sync.' },
      { status: 500 }
    );
  }
}
