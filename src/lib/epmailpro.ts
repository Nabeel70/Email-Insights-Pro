'use server';

import type { Campaign, CampaignStats } from './data';

const API_BASE_URL = 'https://app.epmailpro.com/api/index.php';
const API_KEY = process.env.EPMAILPRO_PUBLIC_KEY;

// This is the single, correct way to make API requests based on our diagnostic tests.
async function makeApiRequest(method: 'GET' | 'POST', endpoint: string, params: Record<string, string> = {}, body: Record<string, any> | null = null) {
  if (!API_KEY) {
    throw new Error('Missing EPMAILPRO_PUBLIC_KEY. Check your .env file.');
  }

  const url = new URL(`${API_BASE_URL}/${endpoint}`);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const headers: HeadersInit = {
    'X-MW-PUBLIC-KEY': API_KEY,
    'Content-Type': 'application/json',
  };

  const options: RequestInit = {
    method,
    headers,
    cache: 'no-store',
  };

  if (method === 'POST' && body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url.toString(), options);

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`API request failed for endpoint ${endpoint}: ${response.status} ${response.statusText}`, { url: url.toString(), errorBody });
    throw new Error(`API Error (${response.status}) for ${endpoint}: ${errorBody}`);
  }

  // Handle cases where the response might be empty (e.g., HTTP 204 No Content)
  const responseText = await response.text();
  if (!responseText) {
    return null;
  }
  
  const result = JSON.parse(responseText);
  
  if (result.status && result.status !== 'success') {
    throw new Error(`API returned a failure status for ${endpoint}: ${JSON.stringify(result.error || result)}`);
  }

  return result;
}


export async function getCampaigns(): Promise<Campaign[]> {
    const result = await makeApiRequest('GET', 'campaigns', {
        page: '1',
        per_page: '100' // Fetch up to 100 campaigns
    });
    return result.data?.records || [];
}

export async function getCampaignStats(campaignUid: string): Promise<CampaignStats | null> {
  try {
    const result = await makeApiRequest('GET', `campaigns/${campaignUid}/stats`);
    if (!result) return null;
    return { ...result.data, campaign_uid: campaignUid };
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
        console.warn(`No stats found for campaign ${campaignUid}. Returning null.`);
        return null;
    }
    console.error(`Error processing getCampaignStats for ${campaignUid}:`, error);
    throw error;
  }
}

// A new generic function for the test page
export async function testEndpoint(method: 'GET' | 'POST', endpoint: string, params: Record<string, string>, body: Record<string, any> | null) {
    return makeApiRequest(method, endpoint, params, body);
}