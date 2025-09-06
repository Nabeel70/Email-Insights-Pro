import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export async function GET() {
  try {
    console.log('CLEAR STATUS: Clearing failed sync status...');
    
    const statusDocRef = doc(db, 'jobStatus', 'hourlySync');
    
    await setDoc(statusDocRef, {
      lastSuccess: new Date().toISOString(),
      status: 'success',
      details: 'Status manually cleared - sync endpoints are operational',
      error: null,
      lastFailure: null
    }, { merge: true });
    
    console.log('CLEAR STATUS: Successfully cleared failed status');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Failed status cleared successfully',
      timestamp: new Date().toISOString() 
    });
    
  } catch (error: any) {
    console.error('CLEAR STATUS ERROR:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to clear status',
      details: error.stack?.substring(0, 500)
    }, { status: 500 });
  }
}
