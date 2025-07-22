'use server';

import type { Campaign, CampaignStats } from './data';

const API_BASE_URL = 'https://app.epmailpro.com/api/index.php';
const API_KEY = process.env.EPMAILPRO_PUBLIC_KEY;

if (!API_KEY) {
  throw new Error('Missing EPMAILPRO_PUBLIC_KEY. Check your environment variables.');
}

const headers = {
  'X-MW-PUBLIC-KEY': API_KEY,
  'Content-Type': 'application/json',
};

type CampaignsApiResponse = {
  status: string;
  data: {
    count: number;
    records: Campaign[];
  };
};

type CampaignStatsApiResponse = {
    status: string;
    data: CampaignStats;
};

type ListsApiResponse = {
    status: string;
    data: {
        count: number;
        records: any[];
    }
}

async function makeApiRequest(endpoint: string, params: Record<string, string> = {}) {
    const urlParams = new URLSearchParams({ endpoint, ...params });
    const url = `${API_BASE_URL}?${urlParams.toString()}`;

    console.log(`Making API request to: ${url}`);
    
    const response = await fetch(url, {
        method: 'GET',
        headers,
        cache: 'no-store'
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`API request failed for endpoint ${endpoint}: ${response.status} ${response.statusText}`, { url, errorBody });
        throw new Error(`API Error (${response.status}) for ${endpoint}: ${errorBody}`);
    }

    const result = await response.json();
    if (result.status !== 'success') {
        throw new Error(`API returned an error for ${endpoint}: ${JSON.stringify(result.error || result)}`);
    }
    return result;
}

export async function getCampaigns(): Promise<Campaign[]> {
    const result: CampaignsApiResponse = await makeApiRequest('campaigns', {
        list_uid: 'ln97199d41cc3', 
        page: '1',
        per_page: '100'
    });
    return result.data.records;
}

export async function getLists(): Promise<any[]> {
    const result: ListsApiResponse = await makeApiRequest('lists', { page: '1', per_page: '100'});
    return result.data.records;
}

export async function getCampaignStats(campaignUid: string): Promise<CampaignStats | null> {
  try {
    const url = `${API_BASE_URL}/campaigns/${campaignUid}/stats`;
    console.log('Fetching campaign stats from:', url);
    const response = await fetch(url, { 
      method: 'GET',
      headers, 
      cache: 'no-store' 
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API Error (${response.status}): ${errorBody}`);
    }
    const result: CampaignStatsApiResponse = await response.json();
    if (result.status !== 'success' || !result.data) {
        console.warn(`API returned success, but no stats data for campaign: ${campaignUid}`, result);
        return null;
    }
    return { ...result.data, campaign_uid: campaignUid };
  } catch (error) {
    if (error instanceof Error) {
        console.error(`Error processing getCampaignStats for ${campaignUid}:`, error.message);
        throw error;
    }
    console.error(`An unknown error occurred in getCampaignStats for ${campaignUid}`);
    throw new Error('An unknown error occurred while fetching campaign stats.');
  }
}
