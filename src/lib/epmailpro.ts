'use server';

import type { Campaign, CampaignStats } from './data';

const API_BASE_URL = 'https://app.epmailpro.com/api/index.php';
// The key is named PUBLIC_KEY because we are using the MailWizz header format.
const API_KEY = process.env.EPMAILPRO_PUBLIC_KEY; 

async function makeApiRequest(endpoint: string, params: Record<string, string> = {}) {
  if (!API_KEY) {
    throw new Error('Missing EPMAILPRO_PUBLIC_KEY. Check your .env file.');
  }

  // Use query parameter for the endpoint, as it's the only format that has worked.
  const urlParams = new URLSearchParams({
    endpoint,
    ...params
  });
  const url = `${API_BASE_URL}?${urlParams.toString()}`;

  console.log(`Making API request to: ${url}`);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      // Use the MailWizz header format, which aligns with our successful tests.
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
  
  // The API returns an empty records array for some valid requests with no data.
  // We should not treat that as an error.
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
    // The API returns data.records for this endpoint.
    return result.data?.records || [];
}

export async function getLists(): Promise<any[]> {
    const result = await makeApiRequest('lists', { page: '1', per_page: '100'});
    return result.data?.records || [];
}

export async function getCampaignStats(campaignUid: string): Promise<CampaignStats | null> {
  try {
    // The stats endpoint is special and uses a path-like structure within the endpoint param.
    const result = await makeApiRequest(`campaigns/${campaignUid}/stats`);

    if (result.status !== 'success' || !result.data) {
        console.warn(`API returned success, but no stats data for campaign: ${campaignUid}`, result);
        return null;
    }
    // The stats data is directly in the 'data' property, not 'data.records'.
    return { ...result.data, campaign_uid: campaignUid };
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
        console.warn(`No stats found for campaign ${campaignUid}. This is expected if the campaign hasn't been sent. Returning null.`);
        return null;
    }
    // Re-throw other errors
    console.error(`Error processing getCampaignStats for ${campaignUid}:`, error);
    throw error;
  }
}
