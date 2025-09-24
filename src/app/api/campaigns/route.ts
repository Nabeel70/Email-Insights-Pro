import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('API: Fetching campaigns...');
    
    const API_KEY = process.env.EPMAILPRO_PUBLIC_KEY;
    if (!API_KEY) {
      return NextResponse.json({ error: 'API key not found' }, { status: 500 });
    }

    // Try to fetch from EP MailPro API first
    try {
      console.log('API: Attempting to call EP MailPro campaigns API...');
      const campaignsResponse = await fetch('https://app.bluespaghetti1.com/api/index.php/campaigns', {
        headers: {
          'X-MW-PUBLIC-KEY': API_KEY,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      console.log('API: Campaigns response status:', campaignsResponse.status);

      if (campaignsResponse.ok) {
        const campaignsText = await campaignsResponse.text();
        let campaignsData;
        try {
          campaignsData = JSON.parse(campaignsText);
        } catch (e) {
          throw new Error('Invalid JSON from campaigns API');
        }

        const campaigns = campaignsData?.data?.records || [];
        console.log(`API: Successfully fetched ${campaigns.length} campaigns from EP MailPro`);

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

        console.log(`API: Successfully fetched ${stats.length} campaign stats from EP MailPro`);
        
        return NextResponse.json({
          success: true,
          data: {
            campaigns,
            stats,
            totalCampaigns: campaigns.length,
            totalStats: stats.length
          },
          source: 'live',
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error(`EP MailPro API returned status: ${campaignsResponse.status}`);
      }
    } catch (fetchError) {
      console.log('API: EP MailPro API not accessible, using mock data for development...');
      console.error('Fetch error:', fetchError);
      
      // Return mock data for development
      const mockCampaigns = [
        {
          campaign_uid: 'mock-campaign-1',
          name: 'Welcome Email Campaign',
          subject: 'Welcome to our newsletter!',
          status: 'sent',
          date_added: '2024-09-20 10:00:00',
          send_date: '2024-09-20 14:00:00',
          list_uid: 'list-1'
        },
        {
          campaign_uid: 'mock-campaign-2', 
          name: 'Product Announcement',
          subject: 'Exciting new features just launched!',
          status: 'sent',
          date_added: '2024-09-19 09:30:00',
          send_date: '2024-09-19 16:00:00',
          list_uid: 'list-1'
        },
        {
          campaign_uid: 'mock-campaign-3',
          name: 'Monthly Newsletter',
          subject: 'September Updates and News',
          status: 'sent',
          date_added: '2024-09-18 11:15:00',
          send_date: '2024-09-18 13:30:00',
          list_uid: 'list-2'
        },
        {
          campaign_uid: 'mock-campaign-4',
          name: 'Special Offer',
          subject: '20% Off Everything - Limited Time!',
          status: 'draft',
          date_added: '2024-09-24 08:00:00',
          send_date: null,
          list_uid: 'list-1'
        },
        {
          campaign_uid: 'mock-campaign-5',
          name: 'Customer Survey',
          subject: 'Help us improve - 2 minute survey',
          status: 'sent',
          date_added: '2024-09-17 14:20:00',
          send_date: '2024-09-17 18:00:00',
          list_uid: 'list-3'
        }
      ];

      const mockStats = [
        {
          campaign_uid: 'mock-campaign-1',
          sent: 2450,
          delivered: 2380,
          bounced: 70,
          opened: 980,
          clicked: 245,
          unsubscribed: 12,
          complained: 3,
          open_rate: 41.2,
          click_rate: 10.3,
          unsubscribe_rate: 0.5
        },
        {
          campaign_uid: 'mock-campaign-2',
          sent: 1850,
          delivered: 1820,
          bounced: 30,
          opened: 728,
          clicked: 146,
          unsubscribed: 8,
          complained: 1,
          open_rate: 40.0,
          click_rate: 8.0,
          unsubscribe_rate: 0.4
        },
        {
          campaign_uid: 'mock-campaign-3',
          sent: 3200,
          delivered: 3150,
          bounced: 50,
          opened: 1260,
          clicked: 315,
          unsubscribed: 15,
          complained: 5,
          open_rate: 40.0,
          click_rate: 10.0,
          unsubscribe_rate: 0.5
        },
        {
          campaign_uid: 'mock-campaign-5',
          sent: 1200,
          delivered: 1180,
          bounced: 20,
          opened: 590,
          clicked: 118,
          unsubscribed: 6,
          complained: 2,
          open_rate: 50.0,
          click_rate: 10.0,
          unsubscribe_rate: 0.5
        }
      ];

      console.log(`API: Using mock data - ${mockCampaigns.length} campaigns and ${mockStats.length} stats`);
      
      return NextResponse.json({
        success: true,
        data: {
          campaigns: mockCampaigns,
          stats: mockStats,
          totalCampaigns: mockCampaigns.length,
          totalStats: mockStats.length
        },
        source: 'mock',
        timestamp: new Date().toISOString(),
        note: 'Development mode: Using mock data because EP MailPro API is not accessible'
      });
    }
    
  } catch (error: any) {
    console.error('API: Failed to fetch campaigns:', error);
    return NextResponse.json({
      error: error.message || 'Failed to fetch campaigns',
      details: error.stack?.substring(0, 500)
    }, { status: 500 });
  }
}
