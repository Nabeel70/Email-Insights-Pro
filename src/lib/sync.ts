
'use server';

import type { DailyReport } from './data';
import { db } from './firebase'; // Use the client-side initialized db
import { collection, writeBatch, doc } from 'firebase/firestore';


export async function storeDailyData(dailyReports: DailyReport[]) {
  console.log(`Storing ${dailyReports.length} reports in Firestore...`);
  try {
    if (dailyReports.length === 0) {
      console.log('No reports provided to store.');
      return { success: true, message: 'No reports to store.', reportsCount: 0 };
    }

    // Firestore client SDK batch writes have a limit of 500 operations.
    // We chunk the reports to handle large syncs safely.
    const chunkSize = 499; 
    for (let i = 0; i < dailyReports.length; i += chunkSize) {
        const chunk = dailyReports.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        const reportsCollection = collection(db, 'dailyReports');

        chunk.forEach(report => {
            // Use the campaignUid as the unique document ID
            const docRef = doc(reportsCollection, report.campaignUid);
            // Use set with merge to create new or update existing documents.
            batch.set(docRef, report, { merge: true });
        });
        
        console.log(`Committing batch of ${chunk.length} reports...`);
        await batch.commit();
    }
    
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
