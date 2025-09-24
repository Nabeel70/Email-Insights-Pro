
import { NextResponse } from 'next/server';
import { syncAllData } from '@/lib/epmailpro';
import { getFirestore } from 'firebase-admin/firestore';
import { admin, adminDb, isInitialized, initError } from '@/lib/server/firebase';

export async function GET(request: Request) {
  try {
    console.log('SYNC: Starting manual data synchronization...');
    
    // Check if Firebase is available
    if (!isInitialized || !adminDb) {
      console.log('SYNC: Firebase not available, proceeding with sync without database storage');
      console.log('SYNC: Firebase init error:', initError?.message || 'Unknown');
      
      // For development without Firebase, we can still sync the data
      // We'll modify syncAllData to handle this case
      const result = await syncAllData(null);
      console.log(`SYNC: ${result.message}`);
      
      return NextResponse.json({ 
        success: true, 
        message: result.message + ' (Firebase storage skipped - not configured for local development)'
      });
    }

    // If Firebase is available, use it normally
    const result = await syncAllData(adminDb);
    console.log(`SYNC: ${result.message}`);
    
    // Update job status using Admin SDK
    try {
      const statusDocRef = adminDb.collection('jobStatus').doc('hourlySync');
      await statusDocRef.set({
        lastSuccess: new Date().toISOString(),
        status: 'success',
        details: result.message,
        error: null // Clear any previous error
      }, { merge: true });
      console.log('SYNC: Successfully logged manual sync status to Firestore using Admin SDK');
    } catch (dbError) {
      console.error('SYNC: Could not log manual sync status to Firestore:', dbError);
    }
    
    return NextResponse.json({ success: true, message: result.message });

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('MANUAL SYNC FAILED:', errorMessage);
    
    // Log failure status using Admin SDK (if available)
    if (isInitialized && adminDb) {
      try {
        const statusDocRef = adminDb.collection('jobStatus').doc('hourlySync');
        await statusDocRef.set({
          lastFailure: new Date().toISOString(),
          status: 'failure',
          error: errorMessage
        }, { merge: true });
        console.log('SYNC: Successfully logged manual sync FAILURE status to Firestore using Admin SDK');
      } catch (dbError) {
        console.error('SYNC: Could not log manual sync FAILURE status to Firestore:', dbError);
      }
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
