import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 EP MailPro API Testing...');
    
    const API_KEY = process.env.EPMAILPRO_PUBLIC_KEY;
    console.log('🔑 API Key available:', !!API_KEY);
    console.log('🔑 API Key (first 10 chars):', API_KEY?.substring(0, 10));
    
    if (!API_KEY) {
      return NextResponse.json({
        error: 'EPMAILPRO_PUBLIC_KEY environment variable not found',
        success: false,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // Test the correct EP MailPro endpoint
    const testUrl = 'https://app.bluespaghetti1.com/api/index.php/campaigns?page=1&per_page=1';
    console.log('🌐 Testing URL:', testUrl);
    
    const response = await fetch(testUrl, {
      headers: {
        'X-MW-PUBLIC-KEY': API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📄 Response (first 200 chars):', responseText.substring(0, 200));

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = responseText;
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      apiKeyPresent: !!API_KEY,
      apiKeyPrefix: API_KEY?.substring(0, 10),
      endpoint: testUrl,
      responseData: responseData,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ API Test Error:', error);
    return NextResponse.json({
      error: error.message,
      success: false,
      stack: error.stack?.substring(0, 500),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
