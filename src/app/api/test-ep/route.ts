import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Testing EP MailPro API...');
    
    const API_KEY = process.env.EPMAILPRO_PUBLIC_KEY;
    if (!API_KEY) {
      return NextResponse.json({ error: 'API key not found' }, { status: 500 });
    }

    // Test simple API call
    const response = await fetch('https://app.bluespaghetti1.com/api/index.php/campaigns?page=1&per_page=1', {
      headers: {
        'X-MW-PUBLIC-KEY': API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    console.log('EP API Response status:', response.status);
    const text = await response.text();
    console.log('EP API Response (first 200 chars):', text.substring(0, 200));

    if (!response.ok) {
      return NextResponse.json({ 
        error: `EP API error: ${response.status}`,
        response: text.substring(0, 500)
      }, { status: 500 });
    }

    try {
      const data = JSON.parse(text);
      return NextResponse.json({ 
        success: true, 
        status: response.status,
        dataCount: data?.data?.records?.length || 0,
        firstCampaign: data?.data?.records?.[0] || null
      });
    } catch (e) {
      return NextResponse.json({ 
        error: 'Invalid JSON response',
        rawResponse: text.substring(0, 500)
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Test EP API error:', error);
    return NextResponse.json({ 
      error: error.message || 'Unknown error',
      stack: error.stack?.substring(0, 500)
    }, { status: 500 });
  }
}
