'use server';

import { NextResponse } from 'next/server';

// Simple API test without Firebase dependencies
export async function GET(request: Request) {
  try {
    console.log('SYNC: Starting manual data synchronization test...');
    
    const API_BASE_URL = 'https://app.bluespaghetti1.com/api/index.php';
    const API_KEY = process.env.EPMAILPRO_PUBLIC_KEY;

    if (!API_KEY) {
      throw new Error('Missing EPMAILPRO_PUBLIC_KEY. Check your .env file.');
    }

    // Test campaigns endpoint
    const campaignsUrl = `${API_BASE_URL}/campaigns?page=1&per_page=10`;
    const campaignsResponse = await fetch(campaignsUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-MW-PUBLIC-KEY': API_KEY,
      },
      cache: 'no-store',
    });

    if (!campaignsResponse.ok) {
      const errorText = await campaignsResponse.text();
      console.error('API Error:', campaignsResponse.status, errorText);
      return NextResponse.json({ 
        error: `API request failed with status ${campaignsResponse.status}`, 
        details: errorText 
      }, { status: 500 });
    }

    const responseText = await campaignsResponse.text();
    console.log('Raw response:', responseText.substring(0, 200) + '...');

    const contentType = campaignsResponse.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Unexpected content type:', contentType);
      console.error('Response text:', responseText);
      return NextResponse.json({ 
        error: `Expected JSON response, but received ${contentType || 'no content type'}`,
        rawResponse: responseText 
      }, { status: 500 });
    }

    if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
      return NextResponse.json({ 
        error: 'Expected JSON but received HTML. This often indicates an authentication error or an incorrect API endpoint.',
        rawResponse: responseText.substring(0, 500)
      }, { status: 500 });
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      return NextResponse.json({ 
        error: 'Invalid JSON response from API',
        rawResponse: responseText,
        parseError: e instanceof Error ? e.message : 'Unknown parse error'
      }, { status: 500 });
    }

    if (result.status && result.status !== 'success') {
      return NextResponse.json({ 
        error: `API returned a failure status: ${JSON.stringify(result.error || result)}`,
        rawResponse: responseText
      }, { status: 500 });
    }

    const campaigns = result.data?.records || result.data || result;
    console.log(`SYNC: Successfully fetched ${campaigns.length} campaigns`);

    return NextResponse.json({ 
      success: true, 
      message: `Sync test successful. Fetched ${campaigns.length} campaigns.`,
      sampleData: campaigns.slice(0, 3) // Return first 3 campaigns as sample
    });

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('MANUAL SYNC TEST FAILED:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
