import { NextResponse } from 'next/server';
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: Request) {
    try {
        const { collectionName, data, idKey } = await request.json();
        
        if (!collectionName || !Array.isArray(data) || !idKey) {
            return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
        }
        
        if (data.length === 0) {
            return NextResponse.json({ success: true, message: 'No data to store' });
        }
        
        console.log(`API: Storing ${data.length} items in Firestore collection '${collectionName}'...`);
        
        // Use batched writes for better performance
        const batches = [];
        let batch = writeBatch(db);
        let operationCount = 0;
        const MAX_BATCH_SIZE = 450;
        
        for (const item of data) {
            let docId: string;
            
            // Extract document ID based on the collection type
            if (idKey === 'campaign_uid') {
                docId = item.campaign_uid;
            } else if (idKey === 'general.list_uid') {
                docId = item.general?.list_uid || item.list_uid;
            } else if (idKey === 'subscriber_uid') {
                docId = item.subscriber_uid;
            } else {
                docId = item[idKey] || `${Date.now()}-${Math.random()}`;
            }
            
            if (!docId) {
                console.warn(`API: Skipping item without valid ${idKey}:`, item);
                continue;
            }
            
            // Add timestamp for tracking
            const documentData = {
                ...item,
                lastUpdated: new Date().toISOString(),
                syncedAt: Date.now()
            };
            
            const docRef = doc(collection(db, collectionName), docId);
            batch.set(docRef, documentData);
            operationCount++;
            
            // Commit batch when it reaches max size
            if (operationCount >= MAX_BATCH_SIZE) {
                batches.push(batch.commit());
                batch = writeBatch(db);
                operationCount = 0;
            }
        }
        
        // Commit remaining operations
        if (operationCount > 0) {
            batches.push(batch.commit());
        }
        
        // Wait for all batches to complete
        await Promise.all(batches);
        
        console.log(`API: Successfully stored ${data.length} items in '${collectionName}' collection.`);
        
        return NextResponse.json({ 
            success: true, 
            message: `Stored ${data.length} items in ${collectionName}`,
            batches: batches.length
        });
        
    } catch (error: any) {
        console.error('API: Failed to store data:', error);
        return NextResponse.json({
            error: error.message || 'Failed to store data',
            details: error.stack?.substring(0, 500)
        }, { status: 500 });
    }
}