
import { NextResponse } from 'next/server';
import { syncAllData } from '@/lib/epmailpro';
import { createDatabase } from '@/lib/database';
import { admin } from '@/lib/firebaseAdmin';

export async function GET(request: Request) {
  try {
    console.log('SYNC: Starting manual data synchronization...');
    
    // Create database abstraction that works in both dev and production
    let firestoreDb;
    try {
      if (admin.apps.length > 0) {
        firestoreDb = admin.firestore();
      }
    } catch (error) {
      console.log('SYNC: Firebase not available, using development mode');
    }
    
    const database = createDatabase(firestoreDb);
    
    // Run the sync using our database abstraction
    const result = await syncAllData(database);
    console.log(`SYNC: ${result.message}`);
    
    // Try to update job status if Firebase is available
    try {
      if (firestoreDb) {
        await database.storeSyncStatus({
          lastSuccess: new Date().toISOString(),
          status: 'success',
          details: result.message,
          error: null
        });
        console.log('SYNC: Successfully logged manual sync status');
      }
    } catch (dbError) {
      console.error('SYNC: Could not log manual sync status:', dbError);
    }
    
    return NextResponse.json({ success: true, message: result.message });

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('MANUAL SYNC FAILED:', errorMessage);
    
    // Try to log failure status if Firebase is available
    try {
      let firestoreDb;
      if (admin.apps.length > 0) {
        firestoreDb = admin.firestore();
      }
      if (firestoreDb) {
        const database = createDatabase(firestoreDb);
        await database.storeSyncStatus({
          lastFailure: new Date().toISOString(),
          status: 'failure',
          error: errorMessage
        });
        console.log('SYNC: Successfully logged manual sync FAILURE status');
      }
    } catch (dbError) {
      console.error('SYNC: Could not log manual sync FAILURE status:', dbError);
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
