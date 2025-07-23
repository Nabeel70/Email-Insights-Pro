

'use server';

import type { Campaign, CampaignStats, EmailList, Subscriber } from './types';

const API_BASE_URL = 'https://app.epmailpro.com/api/index.php';
const API_KEY = process.env.EPMAILPRO_PUBLIC_KEY;

export async function makeApiRequest(
  method: 'GET' | 'POST', 
  endpoint: string, 
  params: Record<string, string> = {}, 
  body: Record<string, any> | null = null
) {
  if (!API_KEY) {
    throw new Error('Missing EPMAILPRO_PUBLIC_KEY. Check your .env file.');
  }

  const url = new URL(`${API_BASE_URL}/${endpoint}`);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

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
    
    // Read body once to avoid consuming it multiple times
    const responseText = await response.text();

    if (!response.ok) {
        let errorDetails = `API request failed with status ${response.status}.`;
        try {
            // Try to parse error from body, if available
            const errorJson = JSON.parse(responseText);
            errorDetails += ` Details: ${JSON.stringify(errorJson.error || errorJson)}`;
        } catch (e) {
            // If the response is not JSON, it might be HTML (like a gateway timeout error)
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
    
    // Handle cases where the response might be empty (e.g., HTTP 204 or empty array '[]')
    if (!responseText) {
      return { data: null, requestInfo };
    }
    
    try {
      const result = JSON.parse(responseText);
      
      // Check for MailWizz-style success wrapper
      if (result.status && result.status !== 'success') {
          const error = new Error(`API returned a failure status: ${JSON.stringify(result.error || result)}`);
          (error as any).requestInfo = requestInfo;
          throw error;
      }

      // The campaigns endpoint returns the records in a `data.records` array,
      // but a single campaign endpoint might return it in `data.record`.
      // The API now seems to be returning the array directly for the main campaigns endpoint.
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
        // The single campaign endpoint returns the data directly under the `record` key
        return data as Campaign;
    } catch (error) {
        console.error(`Could not fetch details for campaign ${campaignUid}. Reason:`, error);
        return null;
    }
}


export async function getCampaigns(): Promise<Campaign[]> {
    // First, get the list of summary campaigns
    const { data: summaryData } = await makeApiRequest('GET', 'campaigns', {
        page: '1',
        per_page: '50' // Fetch a reasonable number of recent campaigns
    });

    const summaryCampaigns = (Array.isArray(summaryData) ? summaryData : summaryData?.records) || [];

    if (summaryCampaigns.length === 0) {
        return [];
    }

    // Then, fetch the full details for each campaign in parallel
    const detailedCampaignsPromises = summaryCampaigns.map(c => getCampaign(c.campaign_uid));
    const detailedCampaignsResults = await Promise.allSettled(detailedCampaignsPromises);

    // Filter out any failed requests and return the successful ones
    const successfullyFetchedCampaigns = detailedCampaignsResults
        .filter((result): result is PromiseFulfilledResult<Campaign | null> => result.status === 'fulfilled' && result.value !== null)
        .map(result => result.value as Campaign);
        
    // Filter out campaigns with 'Farm' or 'Test' in the name
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
    // If the API returns an empty array, it means no stats are available. Treat this as null.
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return null;
    }
    // The API returns the stats object directly, so we add the campaign_uid to it.
    return { ...data, campaign_uid: campaignUid };
  } catch (error) {
    console.error(`Could not fetch or process stats for campaign ${campaignUid}. Reason:`, error);
    return null;
  }
}

export async function getLists(): Promise<EmailList[]> {
    const { data } = await makeApiRequest('GET', 'lists');
    return data || [];
}

export async function getSubscribers(listUid: string): Promise<Subscriber[]> {
    const { data } = await makeApiRequest('GET', `lists/${listUid}/subscribers`, {
        page: '1',
        per_page: '10000',
        status: 'unsubscribed'
    });
    return data || [];
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
