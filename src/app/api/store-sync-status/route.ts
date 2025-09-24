import { NextResponse } from 'next/server';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: Request) {
    try {
        const { status, details, error } = await request.json();
        
        if (!status || !details) {
            return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
        }
        
        const statusDocRef = doc(collection(db, 'jobStatus'), 'hourlySync');
        const statusData: any = {
            status,
            details,
            lastUpdated: new Date().toISOString()
        };
        
        if (status === 'success') {
            statusData.lastSuccess = new Date().toISOString();
            statusData.error = null;
        } else {
            statusData.lastFailure = new Date().toISOString();
            statusData.error = error || 'Unknown error';
        }
        
        await setDoc(statusDocRef, statusData, { merge: true });
        
        return NextResponse.json({ 
            success: true, 
            message: `Logged ${status} status to Firestore`
        });
        
    } catch (error: any) {
        console.error('API: Failed to store sync status:', error);
        return NextResponse.json({
            error: error.message || 'Failed to store sync status'
        }, { status: 500 });
    }
}