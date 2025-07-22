'use server';

import type { Campaign, CampaignStats } from './data';

const API_BASE_URL = 'https://app.epmailpro.com/api/index.php';
const API_KEY = process.env.EPMAILPRO_PUBLIC_KEY;

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
  
  try {
    const result = JSON.parse(responseText);
    
    if (result.status && result.status !== 'success') {
      throw new Error(`API returned a failure status for ${endpoint}: ${JSON.stringify(result.error || result)}`);
    }

    return result;
  } catch(e) {
    if (responseText === "[]") {
      return { data: { records: [] } };
    }
    console.error("Failed to parse JSON response:", responseText);
    throw new Error("Invalid JSON response from API.");
  }

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
    if (!result || !result.data) {
      console.warn(`No stats data returned for campaign ${campaignUid}.`);
      return null;
    }
    // The API returns an empty array if stats are not ready, not an error.
    if (Array.isArray(result.data) && result.data.length === 0) {
      console.warn(`Empty stats array for campaign ${campaignUid}. Assuming no stats available yet.`);
      return null;
    }
    return { ...result.data, campaign_uid: campaignUid };
  } catch (error) {
    // Log the error but don't rethrow, to avoid crashing Promise.all
    console.error(`Could not fetch or process stats for campaign ${campaignUid}. Reason:`, error);
    return null;
  }
}