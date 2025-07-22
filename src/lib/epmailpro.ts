'use server';

import type { Campaign, CampaignStats } from './data';

const API_BASE_URL = 'https://app.epmailpro.com/api/index.php';
const API_KEY = process.env.EPMAILPRO_PUBLIC_KEY;

// This is the single, correct way to make API requests based on our diagnostic tests.
async function makeApiRequest(endpoint: string, params: Record<string, string> = {}) {
  if (!API_KEY) {
    throw new Error('Missing EPMAILPRO_PUBLIC_KEY. Check your .env file.');
  }

  // Use path-based URLs, e.g., .../api/index.php/campaigns
  const url = new URL(`${API_BASE_URL}/${endpoint}`);
  
  // Add any query parameters
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      // Use the MailWizz header format, which was the only one that succeeded.
      'X-MW-PUBLIC-KEY': API_KEY,
      'Content-Type': 'application/json',
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`API request failed for endpoint ${endpoint}: ${response.status} ${response.statusText}`, { url: url.toString(), errorBody });
    throw new Error(`API Error (${response.status}) for ${endpoint}: ${errorBody}`);
  }

  const result = await response.json();
  
  if (result.status && result.status !== 'success') {
    // Handle cases where the API returns a 200 OK but with an error status in the body
    if (result.data?.records?.length === 0 || Object.keys(result.data).length === 0) {
      // This is a special case for endpoints that return empty arrays on success
      return result;
    }
    throw new Error(`API returned a failure status for ${endpoint}: ${JSON.stringify(result.error || result)}`);
  }

  return result;
}


export async function getCampaigns(): Promise<Campaign[]> {
    const result = await makeApiRequest('campaigns', {
        page: '1',
        per_page: '100' // Fetch up to 100 campaigns
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

    // The stats endpoint might return a success status but have an empty data object if no stats exist.
    if (result.status !== 'success' || !result.data || Object.keys(result.data).length === 0) {
        console.warn(`No stats data available for campaign: ${campaignUid}`);
        return null;
    }
    return { ...result.data, campaign_uid: campaignUid };
  } catch (error) {
    // It's possible for stats to 404 if a campaign was never sent. This is not a critical error.
    if (error instanceof Error && error.message.includes("404")) {
        console.warn(`No stats found for campaign ${campaignUid}. This is expected if the campaign hasn't been sent. Returning null.`);
        return null;
    }
    // Re-throw other, more critical errors.
    console.error(`Error processing getCampaignStats for ${campaignUid}:`, error);
    throw error;
  }
}
