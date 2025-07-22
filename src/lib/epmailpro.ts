
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
    const response = await fetch(`${API_BASE_URL}/campaigns`, { headers });
    if (!response.ok) {
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
    const response = await fetch(`${API_BASE_URL}/campaigns/${campaignUid}/stats`, { headers });
    if (!response.ok) {
      // It's possible a campaign might not have stats yet, so we don't throw an error.
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch stats for campaign ${campaignUid}: ${response.statusText}`);
    }
    const result: CampaignStatsApiResponse = await response.json();
     if (result.status !== 'success' || !result.data) {
        // Handle cases where API returns success but data is empty/invalid
        return null;
    }
    // The API returns stats directly in the data object, let's add the UID for mapping
    return { ...result.data, campaign_uid: campaignUid };
  } catch (error) {
    console.error(`Error in getCampaignStats for ${campaignUid}:`, error);
    return null;
  }
}
