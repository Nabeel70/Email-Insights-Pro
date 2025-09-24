
import { NextResponse } from 'next/server';
import { syncAllData } from '@/lib/epmailpro';
import { getFirestore } from 'firebase-admin/firestore';
import { admin } from '@/lib/server/firebase';

export async function GET(request: Request) {
  const adminDb = getFirestore(admin.app());

  // A manual trigger from the UI won't have the Google-Cloud-Scheduler user agent.
  // We check if the request is from a cron job, and if so, we validate the bearer token.
  // Otherwise, we allow the request to proceed, assuming it's a trusted manual trigger.
  const isCron = request.headers.get('User-Agent')?.includes('Google-Cloud-Scheduler');
  
  if (isCron) {
      const authToken = (request.headers.get('authorization') || '').split('Bearer ').at(1);
      if (!process.env.CRON_SECRET || authToken !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
      }
  }

  try {
    console.log('SYNC: Starting hourly data synchronization using Admin SDK...');
    
    // Pass the adminDb instance to the sync function
    const result = await syncAllData(adminDb);
    console.log(`SYNC: ${result.message}`);
    
    // Update Firebase with success status using Admin SDK
    try {
      const statusDocRef = adminDb.collection('jobStatus').doc('hourlySync');
      await statusDocRef.set({
        lastSuccess: new Date().toISOString(),
        status: 'success',
        details: result.message,
        error: null // Clear any previous error
      }, { merge: true });
      console.log('SYNC: Successfully logged job status to Firestore using Admin SDK');
    } catch (dbError) {
      console.error('SYNC: Could not log job status to Firestore after successful sync:', dbError);
    }
    
    return NextResponse.json({ success: true, message: result.message });

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('SYNC JOB FAILED:', errorMessage);
    
    // Log failure status using Admin SDK
    try {
      const statusDocRef = adminDb.collection('jobStatus').doc('hourlySync');
      await statusDocRef.set({
        lastFailure: new Date().toISOString(),
        status: 'failure',
        error: errorMessage
      }, { merge: true });
      console.log('SYNC: Successfully logged job FAILURE status to Firestore using Admin SDK');
    } catch (dbError) {
      console.error('SYNC: Could not log job FAILURE status to Firestore:', dbError);
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
