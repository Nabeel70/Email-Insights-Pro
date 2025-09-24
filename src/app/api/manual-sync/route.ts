
import { NextResponse } from 'next/server';
import { syncAllData } from '@/lib/epmailpro';
import { getFirestore } from 'firebase-admin/firestore';
import { admin } from '@/lib/server/firebase';

export async function GET(request: Request) {
  const adminDb = getFirestore(admin.app());
  try {
    console.log('SYNC: Starting manual data synchronization using Admin SDK...');
    
    // Pass the adminDb instance to the sync function
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
    
    // Log failure status using Admin SDK
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
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
