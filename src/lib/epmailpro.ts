

'use server';

import type { Campaign, CampaignStats, EmailList, Subscriber } from './data';

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
    'X-MW-PUBLIC-KEY': API_KEY,
    'Content-Type': 'application/json',
  };

  const options: RequestInit = {
    method,
    headers,
    cache: 'no-store',
  };

  if (method === 'POST' && body) {
    options.body = JSON.stringify(body);
  }

  const requestInfo = {
    url: url.toString(),
    headers: { 'X-MW-PUBLIC-KEY': API_KEY, 'Content-Type': 'application/json' },
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
            errorDetails += ` Response body: ${responseText}`;
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

      // If there's a data wrapper, return the content of data. Otherwise, return the whole result.
      const data = result.data !== undefined ? result.data : result;
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


export async function getCampaigns(): Promise<Campaign[]> {
    const { data } = await makeApiRequest('GET', 'campaigns', {
        page: '1',
        per_page: '100' // Fetch up to 100 campaigns
    });
    return data?.records || [];
}

export async function getCampaignStats(campaignUid: string): Promise<CampaignStats | null> {
  try {
    const { data } = await makeApiRequest('GET', `campaigns/${campaignUid}/stats`);
    if (!data || (Array.isArray(data) && data.length === 0)) {
      console.warn(`No stats data returned for campaign ${campaignUid}.`);
      return null;
    }
    return { ...data, campaign_uid: campaignUid };
  } catch (error) {
    // Log the error but don't rethrow, to avoid crashing Promise.all
    console.error(`Could not fetch or process stats for campaign ${campaignUid}. Reason:`, error);
    return null;
  }
}

export async function getLists(): Promise<EmailList[]> {
    const { data } = await makeApiRequest('GET', 'lists', {
        page: '1',
        per_page: '100'
    });
    return data?.records || [];
}

export async function getSubscribers(listUid: string): Promise<Subscriber[]> {
    const { data } = await makeApiRequest('GET', `lists/${listUid}/subscribers`, {
        page: '1',
        per_page: '10000', // Get a large number of subscribers
        status: 'unsubscribed'
    });
    return data?.records || [];
}
