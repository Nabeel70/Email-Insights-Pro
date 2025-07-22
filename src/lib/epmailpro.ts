'use server';

import type { Campaign, CampaignStats } from './data';

const API_BASE_URL = 'https://app.epmailpro.com/api/index.php';
const API_KEY = process.env.EPMAILPRO_API_KEY || process.env.EPMAILPRO_PUBLIC_KEY;

// The function that the application will use once we know the correct syntax.
async function makeApiRequest(endpoint: string, params: Record<string, string> = {}) {
  if (!API_KEY) {
    throw new Error('Missing EPMAILPRO_API_KEY or EPMAILPRO_PUBLIC_KEY. Check your .env file.');
  }

  // Using the query parameter format which has shown success.
  const urlParams = new URLSearchParams({
    endpoint,
    ...params
  });
  const url = `${API_BASE_URL}?${urlParams.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      // Using the MailWizz header format which has shown success.
      'X-MW-PUBLIC-KEY': API_KEY,
      'Content-Type': 'application/json',
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`API request failed for endpoint ${endpoint}: ${response.status} ${response.statusText}`, { url, errorBody });
    throw new Error(`API Error (${response.status}) for ${endpoint}: ${errorBody}`);
  }

  const result = await response.json();
  
  if (result.status && result.status !== 'success' && result.data?.records?.length !== 0) {
    throw new Error(`API returned a failure status for ${endpoint}: ${JSON.stringify(result.error || result)}`);
  }

  return result;
}


export async function getCampaigns(): Promise<Campaign[]> {
    const result = await makeApiRequest('campaigns', {
        page: '1',
        per_page: '100'
    });
    return result.data?.records || [];
}

export async function getLists(): Promise<any[]> {
    const result = await makeApiRequest('lists', { page: '1', per_page: '100'});
    return result.data?.records || [];
}

export async function getCampaignStats(campaignUid: string): Promise<CampaignStats | null> {
  try {
    const result = await makeApiRequest(`campaigns/${campaignUid}/stats`);

    if (result.status !== 'success' || !result.data) {
        console.warn(`API returned success, but no stats data for campaign: ${campaignUid}`, result);
        return null;
    }
    return { ...result.data, campaign_uid: campaignUid };
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
        console.warn(`No stats found for campaign ${campaignUid}. This is expected if the campaign hasn't been sent. Returning null.`);
        return null;
    }
    console.error(`Error processing getCampaignStats for ${campaignUid}:`, error);
    throw error;
  }
}

// --- DIAGNOSTIC FUNCTIONS ---

type DiagnosticResult = {
    testName: string;
    url: string;
    headers: Record<string, string>;
    status: 'success' | 'failure';
    httpStatus?: number;
    responseBody: any;
};

async function runTest(testName: string, url: string, headers: Record<string, string>): Promise<DiagnosticResult> {
    try {
        const response = await fetch(url, { method: 'GET', headers, cache: 'no-store' });
        const body = await response.json().catch(() => response.text());

        if (response.ok && body.status === 'success') {
            return { testName, url, headers, status: 'success', httpStatus: response.status, responseBody: body };
        }
        return { testName, url, headers, status: 'failure', httpStatus: response.status, responseBody: body };
    } catch (error) {
        return { testName, url, headers, status: 'failure', responseBody: (error as Error).message };
    }
}

export async function runApiDiagnostics(): Promise<DiagnosticResult[]> {
    if (!API_KEY) {
        throw new Error('API Key is not set in .env file.');
    }

    const pathUrl = `${API_BASE_URL}/campaigns`;
    const queryUrl = `${API_BASE_URL}?endpoint=campaigns`;

    const headersToTest = {
        'X-EP-API-KEY': { 'X-EP-API-KEY': API_KEY, 'Content-Type': 'application/json' },
        'X-MW-PUBLIC-KEY': { 'X-MW-PUBLIC-KEY': API_KEY, 'Content-Type': 'application/json' },
        'Bearer Token': { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    };

    const tests: Promise<DiagnosticResult>[] = [];

    for (const [headerName, headers] of Object.entries(headersToTest)) {
        // Test path-based URL
        tests.push(runTest(`Path URL with ${headerName}`, pathUrl, headers));
        // Test query-based URL
        tests.push(runTest(`Query URL with ${headerName}`, queryUrl, headers));
    }
    
    const results = await Promise.all(tests);
    return results;
}
