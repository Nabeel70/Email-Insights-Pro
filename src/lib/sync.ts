'use server';

import { adminDb } from './firebase-admin';
import type { DailyReport } from './data';

export async function storeDailyData(dailyReports: DailyReport[]) {
  console.log(`Storing ${dailyReports.length} reports in Firestore...`);
  try {
    if (dailyReports.length === 0) {
      console.log('No reports provided to store.');
      return { success: true, message: 'No reports to store.', reportsCount: 0 };
    }

    const batch = adminDb.batch();
    const reportsCollection = adminDb.collection('dailyReports');

    dailyReports.forEach(report => {
      // Use a combination of date and campaign name to create a unique ID
      const docId = `${report.date}-${report.campaignName.replace(/[^a-zA-Z0-9]/g, '')}`;
      const docRef = reportsCollection.doc(docId);
      // Use set with merge to create new or update existing documents.
      batch.set(docRef, report, { merge: true });
    });

    await batch.commit();
    console.log(`Successfully stored ${dailyReports.length} reports in Firestore.`);
    
    return {
      success: true,
      message: `Sync complete. Stored ${dailyReports.length} reports.`,
      reportsCount: dailyReports.length,
    };
  } catch (error) {
    console.error('Error during data storage:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred while writing to Firestore',
      reportsCount: 0,
    };
  }
}
