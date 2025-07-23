

'use server';

import type { Campaign, CampaignStats, EmailList, Subscriber } from './types';

const API_BASE_URL = 'https://app.epmailpro.com/api/index.php';
const API_KEY = process.env.EPMAILPRO_PUBLIC_KEY;

export async function makeApiRequest(
  method: 'GET' | 'POST',
  endpoint: string,
  params?: Record<string, string>,
  body: Record<string, any> | null = null
) {
  if (!API_KEY) {
    throw new Error('Missing EPMAILPRO_PUBLIC_KEY. Check your .env file.');
  }

  const url = new URL(`${API_BASE_URL}/${endpoint}`);

  if (method === 'GET' && params) {
    url.search = new URLSearchParams(params).toString();
  }

  const headers: HeadersInit = {
    'X-EP-API-KEY': API_KEY,
  };

  const options: RequestInit = {
    method,
    headers,
    cache: 'no-store',
  };

  if (method === 'POST' && body) {
    options.body = JSON.stringify(body);
    headers['Content-Type'] = 'application/json';
  }

  const requestInfo = {
    url: url.toString(),
    headers: { 'X-EP-API-KEY': API_KEY },
  };

  try {
    const response = await fetch(url.toString(), options);
    
    const responseText = await response.text();

    if (!response.ok) {
        let errorDetails = `API request failed with status ${response.status}.`;
        try {
            const errorJson = JSON.parse(responseText);
            errorDetails += ` Details: ${JSON.stringify(errorJson.error || errorJson)}`;
        } catch (e) {
            if (responseText.toLowerCase().includes('</html>')) {
              errorDetails += ' The response was HTML, not JSON. This often indicates a server or gateway error.';
            } else {
              errorDetails += ` Response body: ${responseText}`;
            }
        }
        const error = new Error(errorDetails);
        (error as any).requestInfo = requestInfo;
        throw error;
    }
    
    if (!responseText) {
      return { data: null, requestInfo };
    }
    
    try {
      const result = JSON.parse(responseText);
      
      if (result.status && result.status !== 'success') {
          const error = new Error(`API returned a failure status: ${JSON.stringify(result.error || result)}`);
          (error as any).requestInfo = requestInfo;
          throw error;
      }

      const data = result.data?.records || result.data?.record || result.data || result;
      return { data, requestInfo };

    } catch(e) {
      if (responseText === "[]") {
        return { data: [], requestInfo };
      }
      const error = new Error(`Invalid JSON response from API. Raw text: ${responseText}`);
      (error as any).requestInfo = requestInfo;
      throw error;
    }

  } catch (e: any) {
    if(!(e as any).requestInfo) {
      (e as any).requestInfo = requestInfo;
    }
    throw e;
  }
}

export async function getCampaign(campaignUid: string): Promise<Campaign | null> {
    try {
        const { data } = await makeApiRequest('GET', `campaigns/${campaignUid}`);
        if (!data) return null;
        return data as Campaign;
    } catch (error) {
        console.error(`Could not fetch details for campaign ${campaignUid}. Reason:`, error);
        return null;
    }
}


export async function getCampaigns(): Promise<Campaign[]> {
    const { data: summaryData } = await makeApiRequest('GET', 'campaigns', {
        page: '1',
        per_page: '50'
    });

    const summaryCampaigns = (Array.isArray(summaryData) ? summaryData : summaryData?.records) || [];

    if (summaryCampaigns.length === 0) {
        return [];
    }

    const detailedCampaignsPromises = summaryCampaigns.map(c => getCampaign(c.campaign_uid));
    const detailedCampaignsResults = await Promise.allSettled(detailedCampaignsPromises);

    const successfullyFetchedCampaigns = detailedCampaignsResults
        .filter((result): result is PromiseFulfilledResult<Campaign | null> => result.status === 'fulfilled' && result.value !== null)
        .map(result => result.value as Campaign);
        
    const filteredCampaigns = successfullyFetchedCampaigns.filter(campaign => {
        if (!campaign || !campaign.name) return false;
        const lowerCaseName = campaign.name.toLowerCase();
        return !lowerCaseName.includes('farm') && !lowerCaseName.includes('test');
    });

    return filteredCampaigns;
}

export async function getCampaignStats(campaignUid: string): Promise<CampaignStats | null> {
  try {
    const { data } = await makeApiRequest('GET', `campaigns/${campaignUid}/stats`);
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return null;
    }
    return { ...data, campaign_uid: campaignUid };
  } catch (error) {
    console.error(`Could not fetch or process stats for campaign ${campaignUid}. Reason:`, error);
    return null;
  }
}

export async function getSubscribers(listUid: string): Promise<Subscriber[]> {
    const { data } = await makeApiRequest('GET', `lists/${listUid}/subscribers`, {
        page: '1',
        per_page: '10000',
        status: 'unsubscribed'
    });
    return (Array.isArray(data) ? data : data?.records) || [];
}

export async function getSubscriber(subscriberUid: string): Promise<Subscriber | null> {
    try {
        const { data } = await makeApiRequest('GET', `subscribers/${subscriberUid}`);
        if (!data) return null;
        return data as Subscriber;
    } catch (error) {
        console.error(`Could not fetch details for subscriber ${subscriberUid}. Reason:`, error);
        return null;
    }
}

export async function getLists(): Promise<EmailList[]> {
    const { data } = await makeApiRequest('GET', 'lists');
    return (Array.isArray(data) ? data : data?.records) || [];
}
