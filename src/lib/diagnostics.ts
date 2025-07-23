
'use server';

import { collection, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase'; // Use the client-side initialized db

export async function testFirestoreConnection() {
  const docId = `test-${Date.now()}`;
  // Note: Firestore security rules must allow this operation from the server.
  // App Hosting automatically configures this.
  const docRef = doc(db, 'diagnostics', docId);
  const testData = {
    timestamp: new Date(),
    status: 'ok',
    message: 'This is a test document from the diagnostics page.',
  };

  try {
    // 1. Write Operation
    await setDoc(docRef, testData);

    // 2. Read Operation
    const snapshot = await getDoc(docRef);
    const data = snapshot.data();

    // 3. Delete Operation
    await deleteDoc(docRef);
    
    if (!snapshot.exists() || !data) {
        throw new Error('Read operation failed. Document not found after writing.');
    }
    
    if (data.status !== 'ok') {
        throw new Error('Data mismatch. Read data does not match written data.');
    }

    return {
      success: true,
      message: 'Successfully connected to Firestore and performed write, read, and delete operations using the client SDK on the server.',
      details: {
        written: testData,
        read: data,
        deleted: true
      },
    };
  } catch (error) {
    console.error('Firestore diagnostics test failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    if (errorMessage.toLowerCase().includes('permission-denied')) {
        throw new Error(
            'Firestore Permission Denied. This can happen if your Firestore security rules do not allow server-side operations. If you are using App Hosting, this should be configured automatically. Check your Firestore rules in the Firebase console.'
        );
    }

    throw new Error(`Firestore diagnostics failed: ${errorMessage}`);
  }
}
