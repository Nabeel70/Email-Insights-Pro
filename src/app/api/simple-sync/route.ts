import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('SIMPLE SYNC: Starting...');
    
    const API_KEY = process.env.EPMAILPRO_PUBLIC_KEY;
    if (!API_KEY) {
      return NextResponse.json({ error: 'API key not found' }, { status: 500 });
    }

    // Simple test: just fetch campaigns to verify API is working
    const campaignsResponse = await fetch('https://app.bluespaghetti1.com/api/index.php/campaigns?page=1&per_page=5', {
      headers: {
        'X-MW-PUBLIC-KEY': API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    console.log('SIMPLE SYNC: Campaigns API status:', campaignsResponse.status);

    if (!campaignsResponse.ok) {
      const errorText = await campaignsResponse.text();
      console.log('SIMPLE SYNC: Campaigns API error:', errorText.substring(0, 200));
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

    console.log('SIMPLE SYNC: Successfully fetched campaigns');

    return NextResponse.json({ 
      success: true, 
      message: `Simple sync complete. Found ${campaignsData?.data?.records?.length || 0} campaigns.`,
      campaigns: campaignsData?.data?.records || []
    });

  } catch (error: any) {
    console.error('SIMPLE SYNC ERROR:', error);
    return NextResponse.json({ 
      error: error.message || 'Unknown error',
      stack: error.stack?.substring(0, 500)
    }, { status: 500 });
  }
}
