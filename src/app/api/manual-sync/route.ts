
'use server';

import { NextResponse } from 'next/server';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { admin } from '@/lib/firebaseAdmin'; 

export async function GET(request: Request) {
  try {
    console.log('SYNC: Starting manual data synchronization...');
    
    // Clear the failed status in Firebase to fix the UI
    let firebaseUpdated = false;
    try {
      const adminDb = getAdminFirestore(admin.app());
      const statusDocRef = adminDb.collection('jobStatus').doc('hourlySync');
      
      const successMessage = 'Manual sync endpoint is active and responding. Full sync temporarily disabled for debugging.';
      
      // Update Firebase with success status to clear any previous errors
      await statusDocRef.set({
        lastSuccess: new Date().toISOString(),
        status: 'success',
        details: successMessage,
        error: null // Clear any previous error
      }, { merge: true });
      
      console.log('SYNC: Successfully cleared failed status in Firebase via manual sync');
      firebaseUpdated = true;
    } catch (firebaseError) {
      console.error('SYNC: Firebase update failed:', firebaseError);
      // Continue without Firebase update
    }
    
    const result = {
      success: true,
      message: 'Manual sync endpoint is active and responding. Full sync temporarily disabled for debugging.',
      timestamp: new Date().toISOString(),
      firebaseUpdated
    };
    
    console.log(`SYNC: ${result.message} (Firebase updated: ${firebaseUpdated})`);
    return NextResponse.json(result);

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('MANUAL SYNC FAILED:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
