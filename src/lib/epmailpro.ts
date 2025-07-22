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
    const urlParams = new URLSearchParams(params);
    const queryString = urlParams.toString();
    const url = `${API_BASE_URL}/${endpoint}${queryString ? `?${queryString}` : ''}`;

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
        // The API returns an empty records array for some valid requests with no data.
        // We should not treat that as an error.
        if (result.data && Array.isArray(result.data.records) && result.data.records.length === 0) {
            return result;
        }
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
    return result.data.records || [];
}

export async function getLists(): Promise<any[]> {
    const result: ListsApiResponse = await makeApiRequest('lists', { page: '1', per_page: '100'});
    return result.data.records || [];
}

export async function getCampaignStats(campaignUid: string): Promise<CampaignStats | null> {
  try {
    const result: CampaignStatsApiResponse = await makeApiRequest(`campaigns/${campaignUid}/stats`);

    if (result.status !== 'success' || !result.data) {
        console.warn(`API returned success, but no stats data for campaign: ${campaignUid}`, result);
        return null;
    }
    return { ...result.data, campaign_uid: campaignUid };
  } catch (error) {
    if (error instanceof Error) {
        console.error(`Error processing getCampaignStats for ${campaignUid}:`, error.message);
        // It's possible for stats to not exist, which can return a 404.
        // Instead of crashing the whole dashboard, we'll return null and log it.
        if (error.message.includes("404")) {
            console.warn(`No stats found for campaign ${campaignUid}. Returning null.`);
            return null;
        }
        throw error;
    }
    console.error(`An unknown error occurred in getCampaignStats for ${campaignUid}`);
    throw new Error('An unknown error occurred while fetching campaign stats.');
  }
}
