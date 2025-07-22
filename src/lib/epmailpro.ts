'use server';

import type { Campaign, CampaignStats } from './data';

const API_BASE_URL = 'https://app.epmailpro.com/api/index.php';
const API_KEY = process.env.EP_MAIL_PRO_API_KEY;

if (!API_KEY) {
  throw new Error('Missing EP_MAIL_PRO_API_KEY. Check your environment variables.');
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

// Test with no params
export async function getCampaigns(): Promise<Campaign[]> {
  try {
    const url = `${API_BASE_URL}/campaigns`;
    console.log('Fetching campaigns from (no params):', url);
    const response = await fetch(url, { 
      method: 'GET',
      headers, 
      cache: 'no-store' 
    });
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
    if (error instanceof Error) throw error;
    throw new Error('An unknown error occurred while fetching campaigns.');
  }
}

// Test with params
export async function getCampaignsWithParams(page: number, per_page: number): Promise<Campaign[]> {
  try {
    const params = new URLSearchParams({
      list_uid: 'ln97199d41cc3',
      page: page.toString(),
      per_page: per_page.toString()
    });
    const url = `${API_BASE_URL}/campaigns?${params.toString()}`;
    console.log('Fetching campaigns from (with params):', url);
    const response = await fetch(url, { 
      method: 'GET',
      headers, 
      cache: 'no-store' 
    });
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
    console.error('Error in getCampaignsWithParams:', error);
    if (error instanceof Error) throw error;
    throw new Error('An unknown error occurred while fetching campaigns.');
  }
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

// Function for raw API call test
export async function testRawApiCall() {
  const url = `${API_BASE_URL}/campaigns`;
  console.log('Testing Raw API Call:', url);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });
    const rawResponse = await response.text();
    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: rawResponse,
    };
  } catch (e: any) {
    return {
        error: true,
        message: e.message,
        stack: e.stack
    }
  }
}

// Function to test URL variations
export async function testUrlVariations() {
  const urlsToTest = [
    `${API_BASE_URL}/campaigns`,
    `${API_BASE_URL}/campaigns/`,
    `https://app.epmailpro.com/api/campaigns`,
    `${API_BASE_URL}/campaigns?list_uid=ln97199d41cc3`,
  ];

  const results = [];
  for (const url of urlsToTest) {
    console.log('Testing URL variation:', url);
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers,
            cache: 'no-store',
        });
        const body = await response.text();
        results.push({ url, status: response.status, body: body.substring(0, 200) + '...' });
    } catch (e: any) {
        results.push({ url, error: true, message: e.message });
    }
  }
  return results;
}