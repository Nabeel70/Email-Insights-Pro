import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('API TEST: Checking environment and EP MailPro connectivity...');
    
    const API_KEY = process.env.EPMAILPRO_PUBLIC_KEY;
    const API_BASE_URL = 'https://app.bluespaghetti1.com/api/index.php';
    
    // Check environment variables
    if (!API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'EP MailPro API key not configured',
        envCheck: {
          hasApiKey: false,
          apiKeyLength: 0
        }
      }, { status: 500 });
    }

    console.log(`API TEST: API key found, length: ${API_KEY.length}`);

    // Test basic connectivity
    const testResponse = await fetch(`${API_BASE_URL}/campaigns?page=1&per_page=1`, {
      headers: {
        'X-MW-PUBLIC-KEY': API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    console.log(`API TEST: EP MailPro response status: ${testResponse.status}`);

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      return NextResponse.json({
        success: false,
        error: `EP MailPro API error: ${testResponse.status}`,
        details: errorText.substring(0, 200),
        envCheck: {
          hasApiKey: true,
          apiKeyLength: API_KEY.length,
          baseUrl: API_BASE_URL
        }
      }, { status: 500 });
    }

    const testData = await testResponse.json();
    console.log(`API TEST: EP MailPro response:`, testData);

    return NextResponse.json({
      success: true,
      message: 'EP MailPro API connectivity verified',
      envCheck: {
        hasApiKey: true,
        apiKeyLength: API_KEY.length,
        baseUrl: API_BASE_URL
      },
      testResponse: {
        status: testData.status,
        recordCount: testData.data?.count || 0,
        hasRecords: Array.isArray(testData.data?.records)
      }
    });

  } catch (error: any) {
    console.error('API TEST: Failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'API test failed',
      details: error.stack?.substring(0, 500)
    }, { status: 500 });
  }
}
