
import { NextResponse } from 'next/server';
import { syncAllData } from '@/lib/epmailpro';
import { getFirestore } from 'firebase-admin/firestore';
import { isFirebaseInitialized, getAdminApp, getFirebaseError } from '@/lib/server/firebase';

export async function GET(request: Request) {
  try {
    console.log('SYNC: Starting manual data synchronization...');
    
    // Check if Firebase is available
    if (!isFirebaseInitialized()) {
      console.log('SYNC: Firebase not available in development mode, running sync without database storage...');
      const error = getFirebaseError();
      console.log('SYNC: Firebase error:', error?.message || 'Unknown Firebase initialization error');
      
      // Run sync without database storage for development
      const result = await syncAllData(null);
      console.log(`SYNC: ${result.message} (without Firebase storage)`);
      
      return NextResponse.json({ 
        success: true, 
        message: `${result.message} (Development mode: data not stored to Firebase)`,
        warning: 'Running in development mode without Firebase storage'
      });
    }

    // Firebase is available, proceed normally
    const adminDb = getFirestore(getAdminApp());
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
    
    // Try to log failure status if Firebase is available
    if (isFirebaseInitialized()) {
      try {
        const adminDb = getFirestore(getAdminApp());
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
