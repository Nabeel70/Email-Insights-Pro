import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('API: Fetching campaigns directly from EP MailPro...');
    
    const API_KEY = process.env.EPMAILPRO_PUBLIC_KEY;
    if (!API_KEY) {
      return NextResponse.json({ error: 'API key not found' }, { status: 500 });
    }

    // Fetch campaigns directly from EP MailPro API
    console.log('API: Calling EP MailPro campaigns API...');
    const campaignsResponse = await fetch('https://app.bluespaghetti1.com/api/index.php/campaigns', {
      headers: {
        'X-MW-PUBLIC-KEY': API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    console.log('API: Campaigns response status:', campaignsResponse.status);

    if (!campaignsResponse.ok) {
      const errorText = await campaignsResponse.text();
      console.log('API: Campaigns error response:', errorText.substring(0, 500));
      return NextResponse.json({ 
        error: `EP MailPro API error: ${campaignsResponse.status}`,
        details: errorText.substring(0, 500)
      }, { status: 500 });
    }

    const campaignsText = await campaignsResponse.text();
    let campaignsData;
    try {
      campaignsData = JSON.parse(campaignsText);
    } catch (e) {
      return NextResponse.json({ 
        error: 'Invalid JSON from campaigns API',
        response: campaignsText.substring(0, 500)
      }, { status: 500 });
    }

    const campaigns = campaignsData?.data?.records || [];
    console.log(`API: Successfully fetched ${campaigns.length} campaigns`);

    // Get stats for the campaigns
    const stats = [];
    const recentCampaigns = campaigns.slice(0, 10); // Get stats for recent campaigns only

    for (const campaign of recentCampaigns) {
      if (campaign.campaign_uid) {
        try {
          const statsResponse = await fetch(`https://app.bluespaghetti1.com/api/index.php/campaigns/${campaign.campaign_uid}/stats`, {
            headers: {
              'X-MW-PUBLIC-KEY': API_KEY,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            cache: 'no-store'
          });

          if (statsResponse.ok) {
            const statsText = await statsResponse.text();
            const statsData = JSON.parse(statsText);
            if (statsData?.data) {
              stats.push({
                campaign_uid: campaign.campaign_uid,
                ...statsData.data
              });
            }
          }
        } catch (error) {
          console.log(`API: Failed to get stats for campaign ${campaign.campaign_uid}`);
        }
      }
    }

    console.log(`API: Successfully fetched ${stats.length} campaign stats`);
    
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
