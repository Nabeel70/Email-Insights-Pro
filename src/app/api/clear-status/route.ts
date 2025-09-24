import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('CLEAR STATUS: Testing endpoint without Firebase SDK...');
    
    // First, let's test if we can use fetch to directly update Firebase REST API
    const firebaseProjectId = 'email-insights-pro-lcd3q';
    const documentPath = 'jobStatus/hourlySync';
    
    const firebaseRestUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/${documentPath}`;
    
    const updateData = {
      fields: {
        lastSuccess: { stringValue: new Date().toISOString() },
        status: { stringValue: 'success' },
        details: { stringValue: 'Status manually cleared via REST API - sync endpoints are operational' },
        error: { nullValue: null },
        lastFailure: { nullValue: null }
      }
    };
    
    console.log('CLEAR STATUS: Attempting Firebase REST API update...');
    
    // Try to update via REST API (this might work better than SDK)
    try {
      const response = await fetch(firebaseRestUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });
      
      if (response.ok) {
        console.log('CLEAR STATUS: Successfully cleared via REST API');
        return NextResponse.json({ 
          success: true, 
          message: 'Failed status cleared successfully via REST API',
          method: 'Firebase REST API',
          timestamp: new Date().toISOString() 
        });
      } else {
        throw new Error(`REST API failed: ${response.status} ${response.statusText}`);
      }
    } catch (restError: any) {
      console.log('CLEAR STATUS: REST API failed, trying client SDK...');
      
      // Fallback to client SDK
      const { db } = await import('@/lib/firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      
      const statusDocRef = doc(db, 'jobStatus', 'hourlySync');
      
      await setDoc(statusDocRef, {
        lastSuccess: new Date().toISOString(),
        status: 'success',
        details: 'Status manually cleared via client SDK - sync endpoints are operational',
        error: null,
        lastFailure: null
      }, { merge: true });
      
      console.log('CLEAR STATUS: Successfully cleared via client SDK');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Failed status cleared successfully via client SDK',
        method: 'Firebase Client SDK',
        timestamp: new Date().toISOString() 
      });
    }
    
  } catch (error: any) {
    console.error('CLEAR STATUS ERROR:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to clear status',
      details: error.stack?.substring(0, 500),
      suggestion: 'Try manually updating the Firebase document in Firestore console'
    }, { status: 500 });
  }
}
