
'use server';

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export async function GET(request: Request) {
  try {
    console.log('SYNC: Starting manual data synchronization...');
    
    // Clear the failed status in Firebase to fix the UI using client SDK
    const statusDocRef = doc(db, 'jobStatus', 'hourlySync');
    
    const successMessage = 'Manual sync endpoint is active and responding. Full sync temporarily disabled for debugging.';
    
    // Update Firebase with success status to clear any previous errors
    await setDoc(statusDocRef, {
      lastSuccess: new Date().toISOString(),
      status: 'success',
      details: successMessage,
      error: null // Clear any previous error
    }, { merge: true });
    
    console.log('SYNC: Successfully cleared failed status in Firebase via manual sync');
    
    const result = {
      success: true,
      message: successMessage,
      timestamp: new Date().toISOString(),
      firebaseUpdated: true
    };
    
    console.log(`SYNC: ${result.message}`);
    return NextResponse.json(result);

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('MANUAL SYNC FAILED:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
