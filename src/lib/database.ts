// Database abstraction layer with proper error handling

// Store data with fallback handling
export async function storeRawData(collectionName: string, data: any[], idKey: string) {
    if (data.length === 0) return;
    console.log(`SYNC_STEP: Storing ${data.length} raw items in Firestore collection '${collectionName}'...`);
    
    try {
        // Try to use Firebase client SDK for storing data
        const { db } = await import('./firebase');
        const { collection, doc, setDoc, writeBatch } = await import('firebase/firestore');
        
        // Use batched writes for better performance (max 500 operations per batch)
        const batches = [];
        let batch = writeBatch(db);
        let operationCount = 0;
        const MAX_BATCH_SIZE = 450; // Leave some room below Firebase's 500 limit
        
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
                console.warn(`SYNC_STEP: Skipping item without valid ${idKey}:`, item);
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
        
        console.log(`SYNC_STEP: Successfully stored ${data.length} items in '${collectionName}' collection using ${batches.length} batch(es).`);
        
    } catch (error) {
        console.error(`SYNC_STEP: Firebase storage failed for '${collectionName}', continuing without storage:`, error);
        console.log(`SYNC_STEP: [FALLBACK] Data would be stored: ${data.length} items in '${collectionName}' collection.`);
        // Don't throw error, just log it and continue
    }
}

// Store sync status with fallback handling
export async function storeSyncStatus(status: 'success' | 'failure', details: string, error?: string) {
    try {
        const { db } = await import('./firebase');
        const { collection, doc, setDoc } = await import('firebase/firestore');
        
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
        console.log(`SYNC: Successfully logged ${status} status to Firestore`);
        
    } catch (dbError) {
        console.error(`SYNC: Could not log ${status} status to Firestore, continuing:`, dbError);
        console.log(`SYNC: [FALLBACK] Would log ${status} status: ${details}`);
        if (error) {
            console.log(`SYNC: [FALLBACK] Error details: ${error}`);
        }
        // Don't throw error, just log it and continue
    }
}