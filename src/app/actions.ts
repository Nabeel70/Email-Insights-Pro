'use server';

import { getCampaigns, getCampaignStats } from '@/lib/epmailpro';
import { storeRawCampaigns, storeRawStats } from '@/lib/sync';

export async function syncData() {
  try {
    const campaigns = await getCampaigns();
    if (campaigns.length === 0) {
      return { success: true, message: 'No new campaigns to sync.', campaignsCount: 0, statsCount: 0 };
    }

    const statsPromises = campaigns.map(c => getCampaignStats(c.campaign_uid));
    const statsResults = await Promise.allSettled(statsPromises);
    
    const successfulStats = statsResults
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled' && result.value)
      .map(result => result.value);

    await storeRawCampaigns(campaigns);
    await storeRawStats(successfulStats);
    
    return { 
      success: true, 
      message: `Sync complete. Stored ${campaigns.length} campaigns and ${successfulStats.length} stats records.`,
      campaignsCount: campaigns.length,
      statsCount: successfulStats.length,
    };
  } catch (error) {
    console.error('Server action error during sync:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return {
        success: false,
        error: `Failed to complete data sync: ${errorMessage}`
    }
  }
}
