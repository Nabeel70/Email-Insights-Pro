
'use server';

import type { Campaign, CampaignStats, EmailList, Subscriber } from './types';
import { ApiError, NetworkError, UnexpectedResponseError } from './errors';
import type { Firestore } from 'firebase-admin/firestore';

// ============================================================================
// 1. CONFIGURATION & CONSTANTS
// ============================================================================
const API_BASE_URL = 'https://app.bluespaghetti1.com/api/index.php';
const API_KEY = process.env.EPMAILPRO_PUBLIC_KEY;

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

/**
 * Safely retrieves a nested value from an object using a dot-separated path.
 * @param obj The object to query.
 * @param path The dot-separated path to the value.
 * @returns The value, or undefined if not found.
 */
function getByPath(obj: any, path: string) {
  return path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
}

// ============================================================================
// 3. CORE INFRASTRUCTURE (URL BUILDER & GENERIC API CALL)
// ============================================================================

function buildApiUrl(path: string, params?: Record<string, string | number>): URL {
  const robustBase = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
  const fullPath = path.startsWith('/') ? path.substring(1) : path;
  const url = new URL(fullPath, robustBase);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
  }
  return url;
}

async function apiCall<TSuccessResponse>(
  url: URL,
  options: RequestInit = {}
): Promise<{ data: TSuccessResponse; rawResponse: string }> {
  // Do NOT set Content-Type by default; only for requests with a body.
  const defaultHeaders: HeadersInit = {
    Accept: 'application/json',
    'X-MW-PUBLIC-KEY': API_KEY || '',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    cache: 'no-store',
    redirect: 'manual', // <- detect 30x instead of following to HTML
  };

  if (!API_KEY) {
    throw new Error('Missing EPMAILPRO_PUBLIC_KEY. Check your .env file and App Hosting backend configuration.');
  }

  let response: Response;
  try {
    response = await fetch(url.href, config);
  } catch (error) {
    if (error instanceof TypeError) throw new NetworkError(error);
    throw error;
  }

  // Detect manual redirects early
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location') || '(no Location header)';
    const err = new ApiError(`API returned redirect ${response.status} to ${location}`, response);
    (err as any).redirectLocation = location;
    throw err;
  }

  const responseText = await response.text();

  if (!response.ok) {
    const error = new ApiError(`API request failed with status ${response.status}`, response);
    (error as any).rawResponse = responseText;
    throw error;
  }

  const contentType = (response.headers.get('content-type') || '').toLowerCase();

  // Robust pre-parse check: if it looks like HTML, bail out, even if content-type says JSON
  const trimmed = responseText.trimStart();
  if (trimmed.startsWith('<!doctype') || trimmed.startsWith('<html')) {
    const error = new UnexpectedResponseError(
      `Expected JSON but received HTML. This often indicates an auth/endpoint/redirect issue.`,
      contentType || 'no content type'
    );
    (error as any).rawResponse = responseText.slice(0, 500);
    throw error;
  }

  if (!responseText) {
    return { data: null as TSuccessResponse, rawResponse: responseText };
  }

  try {
    const result = JSON.parse(responseText);
    if (result.status && result.status !== 'success') {
      const error = new ApiError(`API returned a failure status: ${JSON.stringify(result.error || result)}`, response);
      (error as any).rawResponse = responseText;
      throw error;
    }
    const data = (result.data?.records || result.data?.record || result.data || result) as TSuccessResponse;
    return { data, rawResponse: responseText };
  } catch {
    if (responseText === '[]') {
      return { data: [] as TSuccessResponse, rawResponse: responseText };
    }
    const error = new UnexpectedResponseError(`Invalid JSON response from API.`, contentType);
    (error as any).rawResponse = responseText.slice(0, 500);
    throw error;
  }
}

// This wrapper is used by the Test API page.
export async function makeApiRequest(
  method: 'GET' | 'POST' | 'PUT',
  endpoint: string,
  params: Record<string, any> = {},
  body: Record<string, any> | null = null
) {
  const url = buildApiUrl(endpoint, method === 'GET' ? params : undefined);

  const options: RequestInit = { method };

  if (method !== 'GET' && body) {
    if (/unsubscribe-by-email/.test(endpoint)) {
      const form = new URLSearchParams();
      for (const [k, v] of Object.entries(body)) form.append(k, String(v));
      options.body = form as any;
    } else {
      options.body = JSON.stringify(body);
      options.headers = { 'Content-Type': 'application/json' };
    }
  }

  const requestInfo = {
    url: url.href,
    method,
    headers: {
      Accept: 'application/json',
      'X-MW-PUBLIC-KEY': API_KEY ? `****${API_KEY.slice(-4)}` : 'MISSING_KEY',
      ...(options.headers || {}),
    },
    body: options.body || null,
  };

  try {
    const { data, rawResponse } = await apiCall(url, options);
    return { data, requestInfo, rawResponse };
  } catch (error: any) {
    error.requestInfo = requestInfo;
    if (error.rawResponse) (error as any).error = error.message;
    throw error;
  }
}

// ============================================================================
// 4. DATA FETCHING FUNCTIONS (EP MailPro API)
// ============================================================================

async function getCampaign(campaignUid: string): Promise<Campaign | null> {
    const { data } = await apiCall<Campaign>(buildApiUrl(`campaigns/${campaignUid}`));
    return data;
}

export async function getCampaignsForSync(): Promise<Campaign[]> {
    console.log("SYNC_STEP: Fetching campaign summaries...");
    const { data: summaryData } = await apiCall<Campaign[]>(buildApiUrl('campaigns', { page: '1', per_page: '50' }));

    if (!summaryData || summaryData.length === 0) {
        console.log("SYNC_STEP: No summary campaigns found.");
        return [];
    }
    console.log(`SYNC_STEP: Found ${summaryData.length} summary campaigns. Fetching details...`);

    const detailedCampaignsPromises = summaryData.map(c => getCampaign(c.campaign_uid));
    const detailedCampaignsResults = await Promise.allSettled(detailedCampaignsPromises);

    const successfullyFetchedCampaigns = detailedCampaignsResults
        .filter((result): result is PromiseFulfilledResult<Campaign | null> => {
            if (result.status === 'rejected') {
                console.error(`Could not fetch details for a campaign, skipping. Reason:`, result.reason);
                return false;
            }
            return result.value !== null;
        })
        .map(result => result.value as Campaign);
        
    const filteredCampaigns = successfullyFetchedCampaigns.filter(campaign => {
        if (!campaign || !campaign.name) return false;
        const lowerCaseName = campaign.name.toLowerCase();
        return !lowerCaseName.includes('farm') && !lowerCaseName.includes('test');
    });

    console.log(`SYNC_STEP: Successfully fetched and filtered ${filteredCampaigns.length} campaigns.`);
    return filteredCampaigns;
}

export async function getCampaignStats(campaignUid: string): Promise<CampaignStats | null> {
    const { data } = await apiCall<CampaignStats | null>(buildApiUrl(`campaigns/${campaignUid}/stats`));
    if (!data) return null;
    return { ...data, campaign_uid: campaignUid };
}

async function getUnsubscribedSubscribersForSync(listUid: string): Promise<Subscriber[]> {
    const { data } = await apiCall<Subscriber[]>(buildApiUrl(`lists/${listUid}/subscribers`, {
        page: '1',
        per_page: '10000',
        status: 'unsubscribed'
    }));
    return data;
}

export async function getListsForSync(): Promise<EmailList[]> {
    console.log("SYNC_STEP: Fetching lists...");
    const { data: allLists } = await apiCall<EmailList[]>(buildApiUrl('lists'));
    
    if (!allLists) return [];

    const filteredLists = allLists.filter((list: EmailList) => {
        if (!list || !list.general?.name) return false;
        const lowerCaseName = list.general.name.toLowerCase();
        return !lowerCaseName.includes('farm') && !lowerCaseName.includes('test');
    });
    console.log(`SYNC_STEP: Found and filtered ${filteredLists.length} lists.`);
    return filteredLists;
}

// ============================================================================
// 5. FIRESTORE STORAGE LOGIC
// ============================================================================

async function storeRawData(db: Firestore | null, collectionName: string, data: any[], idKey: string) {
    if (data.length === 0) return;
    
    if (!db) {
        console.log(`SYNC_STEP: Firebase not available - would store ${data.length} raw items in collection '${collectionName}' (development mode)`);
        return;
    }
    
    console.log(`SYNC_STEP: Storing ${data.length} raw items in Firestore collection '${collectionName}'...`);
    
    try {
        const batches = [];
        let batch = db.batch();
        let operationCount = 0;
        const MAX_BATCH_SIZE = 450; 
        
        for (const item of data) {
            const docId = getByPath(item, idKey);
            
            if (!docId) {
                console.warn(`SYNC_STEP: Skipping item without valid ${idKey}:`, item);
                continue;
            }
            
            const documentData = {
                ...item,
                lastUpdated: new Date().toISOString(),
                syncedAt: Date.now()
            };
            
            const docRef = db.collection(collectionName).doc(docId);
            batch.set(docRef, documentData, { merge: true });
            operationCount++;
            
            if (operationCount >= MAX_BATCH_SIZE) {
                batches.push(batch.commit());
                batch = db.batch();
                operationCount = 0;
            }
        }
        
        if (operationCount > 0) {
            batches.push(batch.commit());
        }
        
        await Promise.all(batches);
        
        console.log(`SYNC_STEP: Successfully stored ${data.length} items in '${collectionName}' collection using ${batches.length} batch(es).`);
        
    } catch (error) {
        console.error(`SYNC_STEP: Failed to store data in '${collectionName}':`, error);
        throw new Error(`Database storage failed for ${collectionName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// ============================================================================
// 6. MAIN SYNC ORCHESTRATOR
// ============================================================================

export async function syncAllData(db: Firestore | null) {
    try {
        console.log("Starting full data sync...");
        
        if (!db) {
            console.log("Running sync without Firebase storage (development mode)");
        }

        const campaigns = await getCampaignsForSync();
        
        let successfulStats: CampaignStats[] = [];
        if (campaigns.length > 0) {
            const statsPromises = campaigns.map(c => getCampaignStats(c.campaign_uid));
            const statsResults = await Promise.allSettled(statsPromises);
            successfulStats = statsResults
                .filter((result): result is PromiseFulfilledResult<CampaignStats | null> => {
                    if (result.status === 'rejected') {
                        console.error(`Could not fetch stats for a campaign, skipping. Reason:`, result.reason);
                        return false;
                    }
                    return result.value !== null;
                })
                .map(result => result.value as CampaignStats);
        }
        
        await storeRawData(db, 'rawCampaigns', campaigns, 'campaign_uid');
        await storeRawData(db, 'rawStats', successfulStats, 'campaign_uid');
        console.log(`Synced ${campaigns.length} campaigns and ${successfulStats.length} stats records.`);

        const lists = await getListsForSync();
        let uniqueSubscribers: Subscriber[] = [];
        if (lists.length > 0) {
            const unsubscriberPromises = lists.map(list => getUnsubscribedSubscribersForSync(list.general.list_uid));
            const unsubscriberResults = await Promise.allSettled(unsubscriberPromises);
            
            const allUnsubscribers = unsubscriberResults
                .filter((result): result is PromiseFulfilledResult<Subscriber[]> => {
                    if (result.status === 'rejected') {
                        console.error(`Could not fetch unsubscribers for a list, skipping. Reason:`, result.reason);
                        return false;
                    }
                    return true;
                })
                .flatMap(result => result.value);

            const uniqueSubscribersMap = new Map<string, Subscriber>();
            allUnsubscribers.forEach(sub => {
                if (sub && sub.subscriber_uid) {
                    uniqueSubscribersMap.set(sub.subscriber_uid, sub);
                }
            });
            uniqueSubscribers = Array.from(uniqueSubscribersMap.values());
        }
        await storeRawData(db, 'rawLists', lists, 'general.list_uid');
        await storeRawData(db, 'rawUnsubscribers', uniqueSubscribers, 'subscriber_uid');
        console.log(`Synced ${lists.length} lists and ${uniqueSubscribers.length} unsubscribers.`);

        const message = `Sync complete. Fetched ${campaigns.length} campaigns, ${successfulStats.length} stats, ${lists.length} lists, and ${uniqueSubscribers.length} unsubscribers.`;
        return { success: true, message };

    } catch (error) {
        console.error("SYNC JOB FAILED:", error);
        throw error;
    }
}

    