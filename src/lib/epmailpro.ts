

'use server';

import type { Campaign, CampaignStats, EmailList, Subscriber } from './types';

const API_BASE_URL = 'https://app.epmailpro.com/api';
const API_KEY = process.env.EPMAILPRO_PUBLIC_KEY;

export async function makeApiRequest(
  method: 'GET' | 'POST' | 'PUT',
  endpoint: string,
  params: Record<string, any> = {},
  body: Record<string, any> | null = null
) {
  if (!API_KEY) {
    throw new Error('Missing EPMAILPRO_PUBLIC_KEY. Check your .env file and App Hosting backend configuration.');
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  let urlString = `${API_BASE_URL}/${cleanEndpoint}`;

  const headers: HeadersInit = {
      'X-MW-PUBLIC-KEY': API_KEY
  };
  
  const options: RequestInit = {
    method,
    headers,
    cache: 'no-store',
  };

  if (method === 'GET') {
    const searchParams = new URLSearchParams(
        Object.entries(params).map(([key, value]) => [key, String(value)])
    );
    if (searchParams.toString()) {
      urlString += `?${searchParams.toString()}`;
    }
  } else if (body) { // POST or PUT
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const requestInfo = {
    url: urlString,
    headers: { ...headers },
    body: options.body || null,
  };

  try {
    const response = await fetch(urlString, options);
    const responseText = await response.text();

    if (!response.ok) {
        let errorDetails = `API request failed with status ${response.status}.`;
        try {
            const errorJson = JSON.parse(responseText);
            const specificError = errorJson.error || (errorJson.data ? errorJson.data.error : JSON.stringify(errorJson));
            errorDetails += ` Details: ${specificError}`;
        } catch (e) {
            errorDetails += ` Response body: ${responseText}`;
        }
        const error = new Error(errorDetails);
        (error as any).statusCode = response.status;
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

export async function getCampaigns(): Promise<Campaign[]> {
    const { data: summaryData } = await makeApiRequest('GET', 'campaigns', {
        page: '1',
        per_page: '50'
    });
    const summaryCampaigns = (Array.isArray(summaryData) ? summaryData : summaryData?.records) || [];
    if (summaryCampaigns.length === 0) return [];
    
    const campaigns = summaryCampaigns.filter((c: Campaign) => c.name && !c.name.toLowerCase().includes('farm') && !c.name.toLowerCase().includes('test'));
    return campaigns;
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

export async function addEmailToSuppressionList(email: string) {
    const listUid = 'rg591800s2a2c'; // This is the hardcoded suppression list UID.
    let result;
    const endpoint = `suppression-lists/${listUid}/emails`;
    const body = { email: email };

    try {
        const response = await makeApiRequest('POST', endpoint, {}, body);
        result = { listUid: listUid, status: 'success', data: response.data };

    } catch (error: any) {
        result = { listUid: listUid, status: 'failed', error: error.message };
    }

    const summary = {
        message: `Attempted to add '${email}' to suppression list ${listUid}.`,
        success: result.status === 'success',
        result: result
    };

    return summary;
}

// These functions were removed as they are now handled by the isolated datasync.ts
// getCampaign(campaignUid) -> Not required for dashboard
// getLists() -> Not required for dashboard
// getUnsubscribedSubscribers(listUid) -> Not required for dashboard
// getSubscriber(listUid, email) -> Not required for dashboard
