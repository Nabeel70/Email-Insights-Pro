/**
 * Database abstraction layer that works in both development and production
 * In development: logs operations without actually writing to database
 * In production: uses Firebase Admin SDK for database operations
 */

import type { Firestore } from 'firebase-admin/firestore';

export interface DatabaseAbstraction {
  storeData(collectionName: string, data: any[], idKey: string): Promise<void>;
  storeSyncStatus(status: any): Promise<void>;
}

class DevelopmentDatabase implements DatabaseAbstraction {
  async storeData(collectionName: string, data: any[], idKey: string): Promise<void> {
    console.log(`DEV_DB: Would store ${data.length} items in collection '${collectionName}'`);
    console.log(`DEV_DB: Sample data:`, data.slice(0, 2));
  }

  async storeSyncStatus(status: any): Promise<void> {
    console.log('DEV_DB: Would store sync status:', status);
  }
}

class ProductionDatabase implements DatabaseAbstraction {
  constructor(private db: Firestore) {}

  async storeData(collectionName: string, data: any[], idKey: string): Promise<void> {
    if (data.length === 0) return;
    
    const batches = [];
    let batch = this.db.batch();
    let operationCount = 0;
    const MAX_BATCH_SIZE = 450;
    
    for (const item of data) {
      const docId = this.getByPath(item, idKey);
      if (!docId) {
        console.warn(`Skipping item without valid ${idKey}:`, item);
        continue;
      }
      
      const documentData = {
        ...item,
        lastUpdated: new Date().toISOString(),
        syncedAt: Date.now()
      };
      
      const docRef = this.db.collection(collectionName).doc(docId);
      batch.set(docRef, documentData, { merge: true });
      operationCount++;
      
      if (operationCount >= MAX_BATCH_SIZE) {
        batches.push(batch.commit());
        batch = this.db.batch();
        operationCount = 0;
      }
    }
    
    if (operationCount > 0) {
      batches.push(batch.commit());
    }
    
    await Promise.all(batches);
    console.log(`Successfully stored ${data.length} items in '${collectionName}' collection`);
  }

  async storeSyncStatus(status: any): Promise<void> {
    const statusDocRef = this.db.collection('jobStatus').doc('hourlySync');
    await statusDocRef.set(status, { merge: true });
    console.log('Successfully logged sync status to Firestore');
  }

  private getByPath(obj: any, path: string) {
    return path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
  }
}

export function createDatabase(db?: Firestore): DatabaseAbstraction {
  if (db && process.env.NODE_ENV === 'production') {
    return new ProductionDatabase(db);
  } else {
    return new DevelopmentDatabase();
  }
}