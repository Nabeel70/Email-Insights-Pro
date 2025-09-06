
'use server';

import { NextResponse } from 'next/server';
import { syncAllData } from '@/lib/epmailpro';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

// Timeout wrapper function
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

export async function GET(request: Request) {
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
    console.log('SYNC: Starting data synchronization...');
    
    // Add 25 second timeout to prevent hanging
    const result = await withTimeout(syncAllData(), 25000);
    console.log(`SYNC: ${result.message}`);
    
    // Update Firebase with success status using client SDK (compatible with Firebase Hosting)
    try {
      const statusDocRef = doc(db, 'jobStatus', 'hourlySync');
      await setDoc(statusDocRef, {
        lastSuccess: new Date().toISOString(),
        status: 'success',
        details: result.message,
        error: null // Clear any previous error
      }, { merge: true });
      console.log('SYNC: Successfully logged job status to Firestore using client SDK');
    } catch (dbError) {
      console.error('SYNC: Could not log job status to Firestore after successful sync:', dbError);
    }
    
    return NextResponse.json({ success: true, message: result.message });

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('SYNC JOB FAILED:', errorMessage);
    
    // Log failure status using client SDK
    try {
      const statusDocRef = doc(db, 'jobStatus', 'hourlySync');
      await setDoc(statusDocRef, {
        lastFailure: new Date().toISOString(),
        status: 'failure',
        error: errorMessage
      }, { merge: true });
      console.log('SYNC: Successfully logged job FAILURE status to Firestore using client SDK');
    } catch (dbError) {
      console.error('SYNC: Could not log job FAILURE status to Firestore:', dbError);
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
