import { NextResponse } from 'next/server';
import { getCampaignsForSync, getCampaignStats } from '@/lib/epmailpro';

export async function GET() {
  try {
    console.log('API: Fetching campaigns directly from EP MailPro...');
    
    // Fetch campaigns directly from EP MailPro API
    const campaigns = await getCampaignsForSync();
    
    // Get stats for recent campaigns (limit to last 10 for performance)
    const recentCampaigns = campaigns.slice(0, 10);
    const statsPromises = recentCampaigns.map(campaign => 
      getCampaignStats(campaign.campaign_uid).catch(error => {
        console.error(`Failed to get stats for campaign ${campaign.campaign_uid}:`, error);
        return null;
      })
    );
    
    const stats = (await Promise.all(statsPromises)).filter(stat => stat !== null);
    
    console.log(`API: Successfully fetched ${campaigns.length} campaigns and ${stats.length} stats`);
    
    return NextResponse.json({
      success: true,
      data: {
        campaigns,
        stats,
        totalCampaigns: campaigns.length,
        totalStats: stats.length
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('API: Failed to fetch campaigns:', error);
    return NextResponse.json({
      error: error.message || 'Failed to fetch campaigns',
      details: error.stack?.substring(0, 500)
    }, { status: 500 });
  }
}
