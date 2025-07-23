'use server';

import * as admin from 'firebase-admin';

// This function ensures the Firebase Admin SDK is initialized
// and returns the Firestore instance.
function getAdminDb() {
  if (!admin.apps.length) {
    try {
      admin.initializeApp();
    } catch (error) {
      console.error('Firebase admin initialization error', error);
      // Re-throwing the error is important to understand the failure cause.
      throw new Error('Failed to initialize Firebase Admin SDK.');
    }
  }
  return admin.firestore();
}

// Export a single instance of the initialized database.
export const adminDb = getAdminDb();
