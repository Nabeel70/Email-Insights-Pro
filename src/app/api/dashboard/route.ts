import { NextResponse } from 'next/server';

const API_KEY = process.env.EPMAILPRO_PUBLIC_KEY;
const API_BASE_URL = 'https://app.bluespaghetti1.com/api/index.php';

export async function GET() {
  try {
    console.log('DASHBOARD API: Fetching live dashboard data from EP MailPro...');
    
    if (!API_KEY) {
      throw new Error('EP MailPro API key not configured');
    }

    // Fetch campaigns data
    let allCampaigns: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 10) { // Limit to prevent infinite loops
      const campaignsResponse = await fetch(`${API_BASE_URL}/campaigns?page=${page}&per_page=100`, {
        headers: {
          'X-MW-PUBLIC-KEY': API_KEY,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      if (!campaignsResponse.ok) {
        throw new Error(`EP MailPro Campaigns API error: ${campaignsResponse.status}`);
      }

      const campaignsData = await campaignsResponse.json();
      
      if (campaignsData.status !== 'success') {
        throw new Error(`EP MailPro Campaigns API error: ${campaignsData.status}`);
      }

      const campaigns = campaignsData.data?.records || [];
      allCampaigns.push(...campaigns);
      
      hasMore = campaigns.length === 100;
      page++;
      
      console.log(`DASHBOARD API: Campaigns page ${page-1}, got ${campaigns.length} campaigns`);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Fetch lists data
    const listsResponse = await fetch(`${API_BASE_URL}/lists?page=1&per_page=100`, {
      headers: {
        'X-MW-PUBLIC-KEY': API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    let lists: any[] = [];
    if (listsResponse.ok) {
      const listsData = await listsResponse.json();
      if (listsData.status === 'success') {
        lists = listsData.data?.records || [];
      }
    }

    // Calculate dashboard metrics
    const totalCampaigns = allCampaigns.length;
    const activeCampaigns = allCampaigns.filter(c => c.status === 'sent' || c.status === 'sending').length;
    const draftCampaigns = allCampaigns.filter(c => c.status === 'draft').length;
    const totalLists = lists.length;

    // Calculate recent activity (campaigns from last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentCampaigns = allCampaigns.filter(campaign => {
      const createdAt = campaign.date_added ? new Date(campaign.date_added) : null;
      return createdAt && createdAt >= thirtyDaysAgo;
    });

    // Calculate performance metrics from recent campaigns
    let totalOpens = 0;
    let totalClicks = 0;
    let totalSent = 0;
    let totalBounces = 0;
    let totalUnsubscribes = 0;

    recentCampaigns.forEach(campaign => {
      if (campaign.stats) {
        totalOpens += parseInt(campaign.stats.unique_opens || 0);
        totalClicks += parseInt(campaign.stats.unique_clicks || 0);
        totalSent += parseInt(campaign.stats.processed_count || 0);
        totalBounces += parseInt(campaign.stats.bounces_count || 0);
        totalUnsubscribes += parseInt(campaign.stats.unsubscribes_count || 0);
      }
    });

    const openRate = totalSent > 0 ? ((totalOpens / totalSent) * 100).toFixed(2) : '0.00';
    const clickRate = totalSent > 0 ? ((totalClicks / totalSent) * 100).toFixed(2) : '0.00';
    const bounceRate = totalSent > 0 ? ((totalBounces / totalSent) * 100).toFixed(2) : '0.00';

    console.log(`DASHBOARD API: Successfully calculated metrics from ${totalCampaigns} campaigns and ${totalLists} lists`);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalCampaigns,
          activeCampaigns,
          draftCampaigns,
          totalLists,
          recentCampaigns: recentCampaigns.length
        },
        performance: {
          totalSent,
          totalOpens,
          totalClicks,
          totalBounces,
          totalUnsubscribes,
          openRate: parseFloat(openRate),
          clickRate: parseFloat(clickRate),
          bounceRate: parseFloat(bounceRate)
        },
        recentActivity: recentCampaigns.slice(0, 10).map(campaign => ({
          campaign_uid: campaign.campaign_uid,
          name: campaign.name,
          subject: campaign.subject,
          status: campaign.status,
          date_added: campaign.date_added,
          stats: campaign.stats
        })),
        source: 'EP MailPro API Live',
        timestamp: new Date().toISOString()
      }
    });
 
  } catch (error: any) {
    console.error('DASHBOARD API: Failed to fetch from EP MailPro:', error);
    return NextResponse.json({
      error: error.message || 'Failed to fetch dashboard data from EP MailPro',
      details: error.stack?.substring(0, 500),
      source: 'EP MailPro API'
    }, { status: 500 });
  }
}
