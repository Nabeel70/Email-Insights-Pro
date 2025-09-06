
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
  try {
    console.log('SYNC: Starting manual data synchronization...');
    
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
      console.log('SYNC: Successfully logged manual sync status to Firestore using client SDK');
    } catch (dbError) {
      console.error('SYNC: Could not log manual sync status to Firestore:', dbError);
    }
    
    return NextResponse.json({ success: true, message: result.message });

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('MANUAL SYNC FAILED:', errorMessage);
    
    // Log failure status using client SDK
    try {
      const statusDocRef = doc(db, 'jobStatus', 'hourlySync');
      await setDoc(statusDocRef, {
        lastFailure: new Date().toISOString(),
        status: 'failure',
        error: errorMessage
      }, { merge: true });
      console.log('SYNC: Successfully logged manual sync FAILURE status to Firestore using client SDK');
    } catch (dbError) {
      console.error('SYNC: Could not log manual sync FAILURE status to Firestore:', dbError);
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
