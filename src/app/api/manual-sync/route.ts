
import { NextResponse } from 'next/server';
import { syncAllData } from '@/lib/epmailpro';

export async function GET(request: Request) {
  try {
    console.log('SYNC: Starting manual data synchronization...');
    
    // Try to get Firebase Admin db, but don't fail if it's not available
    let adminDb = null;
    try {
      const { getFirestore } = await import('firebase-admin/firestore');
      const { admin } = await import('@/lib/server/firebase');
      adminDb = getFirestore(admin.app());
      console.log('SYNC: Firebase Admin SDK available');
    } catch (firebaseError) {
      console.log('SYNC: Firebase Admin SDK not available in development mode, continuing without Firestore logging');
    }
    
    // Pass the adminDb instance to the sync function (can be null for development)
    const result = await syncAllData(adminDb);
    console.log(`SYNC: ${result.message}`);
    
    // Update job status using Admin SDK if available
    if (adminDb) {
      try {
        const statusDocRef = adminDb.collection('jobStatus').doc('hourlySync');
        await statusDocRef.set({
          lastSuccess: new Date().toISOString(),
          status: 'success',
          details: result.message,
          error: null // Clear any previous error
        }, { merge: true });
        console.log('SYNC: Successfully logged manual sync status to Firestore');
      } catch (dbError) {
        console.error('SYNC: Could not log manual sync status to Firestore:', dbError);
      }
    }
    
    return NextResponse.json({ success: true, message: result.message });

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('MANUAL SYNC FAILED:', errorMessage);
    
    // Try to log failure status if Firebase is available
    try {
      const { getFirestore } = await import('firebase-admin/firestore');
      const { admin } = await import('@/lib/server/firebase');
      const adminDb = getFirestore(admin.app());
      
      const statusDocRef = adminDb.collection('jobStatus').doc('hourlySync');
      await statusDocRef.set({
        lastFailure: new Date().toISOString(),
        status: 'failure',
        error: errorMessage
      }, { merge: true });
      console.log('SYNC: Successfully logged manual sync FAILURE status to Firestore');
    } catch (dbError) {
      console.log('SYNC: Could not log failure status - Firebase not available in development');
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
