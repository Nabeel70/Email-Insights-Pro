
'use server';

import type { Campaign, CampaignStats } from './data';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_KEY = process.env.EP_MAIL_PRO_API_KEY;

if (!API_BASE_URL || !API_KEY) {
  throw new Error('Missing EP MailPro API configuration');
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
    const response = await fetch(`${API_BASE_URL}/campaigns?page=1&per_page=100`, { headers, cache: 'no-store' });
    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Failed to fetch campaigns: ${response.statusText}`, errorBody);
        throw new Error(`Failed to fetch campaigns: ${response.statusText}`);
    }
    const result: CampaignsApiResponse = await response.json();
    if (result.status !== 'success') {
      throw new Error('API returned an error while fetching campaigns');
    }
    return result.data.records;
  } catch (error) {
    console.error('Error in getCampaigns:', error);
    return [];
  }
}

export async function getCampaignStats(campaignUid: string): Promise<CampaignStats | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/campaigns/${campaignUid}/stats`, { headers, cache: 'no-store' });
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
    // Re-throw the error to be caught by the test page
    if (error instanceof Error) {
        console.error(`Error processing getCampaignStats for ${campaignUid}:`, error.message);
        throw error;
    }
    console.error(`An unknown error occurred in getCampaignStats for ${campaignUid}`);
    throw new Error('An unknown error occurred while fetching campaign stats.');
  }
}
