'use server';

import { NextResponse } from 'next/server';
import { syncAllData } from '@/lib/datasync';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export async function GET(request: Request) {
  // 1. Authenticate the request
  const authToken = (request.headers.get('authorization') || '').split('Bearer ').at(1);
  if (!process.env.CRON_SECRET || authToken !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('HOURLY SYNC: Starting data synchronization...');
    const result = await syncAllData();
    console.log(`HOURLY SYNC: ${result.message}`);
    
    // Log successful run to Firestore
    try {
        const statusDocRef = doc(db, 'jobStatus', 'hourlySync');
        await setDoc(statusDocRef, {
            lastSuccess: new Date().toISOString(),
            status: 'success',
            details: result.message
        }, { merge: true });
        console.log('HOURLY SYNC: Successfully logged job status to Firestore.');
    } catch (dbError) {
        console.error('HOURLY SYNC: Could not log job status to Firestore after successful sync.', dbError);
    }

    return NextResponse.json({ success: true, message: result.message });

  } catch (error) {
    // Log job failure to Firestore
     try {
        const statusDocRef = doc(db, 'jobStatus', 'hourlySync');
        await setDoc(statusDocRef, {
            lastFailure: new Date().toISOString(),
            status: 'failure',
            error: (error as Error).message
        }, { merge: true });
    } catch (dbError) {
        console.error('HOURLY SYNC: Could not log job FAILURE status to Firestore.', dbError);
    }
    console.error('HOURLY SYNC JOB FAILED:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
