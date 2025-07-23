
'use server';

import { adminDb } from './firebase-admin';

export async function testFirestoreConnection() {
  const docId = `test-${Date.now()}`;
  const docRef = adminDb.collection('diagnostics').doc(docId);
  const testData = {
    timestamp: new Date(),
    status: 'ok',
    message: 'This is a test document from the diagnostics page.',
  };

  try {
    // 1. Write Operation
    await docRef.set(testData);

    // 2. Read Operation
    const snapshot = await docRef.get();
    const data = snapshot.data();

    // 3. Delete Operation
    await docRef.delete();
    
    if (!snapshot.exists || !data) {
        throw new Error('Read operation failed. Document not found after writing.');
    }
    
    if (data.status !== 'ok') {
        throw new Error('Data mismatch. Read data does not match written data.');
    }

    return {
      success: true,
      message: 'Successfully connected to Firestore and performed write, read, and delete operations.',
      details: {
        written: testData,
        read: data,
        deleted: true
      },
    };
  } catch (error) {
    console.error('Firestore diagnostics test failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    // Provide a more helpful error message if it's a permission issue
    if (errorMessage.toLowerCase().includes('permission denied')) {
        throw new Error(
            'Firestore Permission Denied. This usually means the server environment (e.g., App Hosting) does not have the correct IAM permissions to access Firestore. Please check your project\'s IAM settings and ensure the service account has "Cloud Datastore User" or "Firebase Admin" role.'
        );
    }

    throw new Error(`Firestore diagnostics failed: ${errorMessage}`);
  }
}
