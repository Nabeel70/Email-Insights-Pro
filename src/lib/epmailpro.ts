'use server';

import type { Campaign, CampaignStats } from './data';

const API_BASE_URL = 'https://app.epmailpro.com/api/index.php';
// Use the environment variable name from the documentation's PHP example.
const API_KEY = process.env.EPMAILPRO_PUBLIC_KEY || '';

if (!API_KEY) {
  // This warning is helpful for the developer but won't crash the app.
  console.warn('Warning: EPMAILPRO_PUBLIC_KEY is not set in environment variables.');
}

const headers = {
  'X-EP-API-KEY': API_KEY,
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


export async function getCampaigns(): Promise<Campaign[]> {
  try {
    const url = `${API_BASE_URL}/campaigns`;
    const response = await fetch(url, { headers, cache: 'no-store' });
    
    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Failed to fetch campaigns: ${response.status} ${response.statusText}`, { url, errorBody });
        throw new Error(`API Error (${response.status}): ${errorBody}`);
    }
    const result: CampaignsApiResponse = await response.json();
    if (result.status !== 'success') {
      throw new Error('API returned an error while fetching campaigns');
    }
    return result.data.records;
  } catch (error) {
    console.error('Error in getCampaigns:', error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error('An unknown error occurred while fetching campaigns.');
  }
}

export async function getCampaignStats(campaignUid: string): Promise<CampaignStats | null> {
  try {
    const url = `${API_BASE_URL}/campaigns/${campaignUid}/stats`;
    const response = await fetch(url, { headers, cache: 'no-store' });
    
    if (!response.ok) {
      const errorBody = await response.text();
      // Throw an error with the body so the calling function can display it.
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
        // Re-throw the error to be caught by the UI
        throw error;
    }
    console.error(`An unknown error occurred in getCampaignStats for ${campaignUid}`);
    throw new Error('An unknown error occurred while fetching campaign stats.');
  }
}
