'use server';

import { getCampaigns, getCampaignStats } from './epmailpro';
import { generateDailyReport } from './reporting';
import { adminDb } from './firebase-admin';
import type { DailyReport } from './data';

export async function syncAndStoreDailyData() {
  console.log('Starting data sync...');
  try {
    const campaigns = await getCampaigns();
    console.log(`Fetched ${campaigns.length} campaigns.`);

    if (campaigns.length === 0) {
      console.log('No campaigns found. Skipping sync.');
      return { success: true, message: 'No campaigns to sync.', reportsCount: 0 };
    }

    const statsPromises = campaigns.map(c => getCampaignStats(c.campaign_uid));
    const statsResults = await Promise.allSettled(statsPromises);
    
    const successfulStats = statsResults
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => (result as PromiseFulfilledResult<any>).value);
    
    console.log(`Fetched stats for ${successfulStats.length} campaigns.`);

    const dailyReports: DailyReport[] = generateDailyReport(campaigns, successfulStats);
    console.log(`Generated ${dailyReports.length} daily reports.`);

    if (dailyReports.length === 0) {
      console.log('No reports generated. Nothing to store.');
      return { success: true, message: 'No processable reports generated.', reportsCount: 0 };
    }

    const batch = adminDb.batch();
    const reportsCollection = adminDb.collection('dailyReports');

    dailyReports.forEach(report => {
      // Use a combination of date and campaign name to create a unique ID
      const docId = `${report.date}-${report.campaignName.replace(/[^a-zA-Z0-9]/g, '')}`;
      const docRef = reportsCollection.doc(docId);
      batch.set(docRef, report, { merge: true }); // Use merge to avoid duplicates and update existing
    });

    await batch.commit();
    console.log(`Successfully stored ${dailyReports.length} reports in Firestore.`);
    
    return {
      success: true,
      message: `Sync complete. Stored ${dailyReports.length} reports.`,
      reportsCount: dailyReports.length,
    };
  } catch (error) {
    console.error('Error during data sync:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred',
      reportsCount: 0,
    };
  }
}
