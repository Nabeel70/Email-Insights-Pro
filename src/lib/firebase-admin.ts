'use server';

import * as admin from 'firebase-admin';

// This function ensures the Firebase Admin SDK is initialized
// and returns the Firestore instance.
function getAdminDb() {
  if (!admin.apps.length) {
    try {
      admin.initializeApp();
    } catch (error: any) {
        // This can happen if the app is already initialized in a different part of the environment.
        // If the error is not about a duplicate app, then we should re-throw it.
        if (!/already exists/i.test(error.message)) {
            console.error('Firebase admin initialization error', error);
            // Re-throwing the error is important to understand the failure cause.
            throw new Error('Failed to initialize Firebase Admin SDK.');
        }
    }
  }
  return admin.firestore();
}

// Export a single instance of the initialized database.
export const adminDb = getAdminDb();
