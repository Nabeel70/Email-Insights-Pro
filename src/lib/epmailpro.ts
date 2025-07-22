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


export async function getCampaigns(): Promise<Campaign[]> {
    const { data } = await makeApiRequest('GET', 'campaigns', {
        page: '1',
        per_page: '100' // Fetching more campaigns to be safe
    });
    // The API seems to return the campaigns directly as an array now.
    return (Array.isArray(data) ? data : data?.records) || [];
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
        per_page: '10000',
        status: 'unsubscribed'
    });
    return data?.records || [];
}
