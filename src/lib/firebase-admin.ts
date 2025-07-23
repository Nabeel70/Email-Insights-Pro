'use server';

import * as admin from 'firebase-admin';

// This is the recommended approach for initializing the Firebase Admin SDK in a managed environment like App Hosting.
// We don't need to manually provide a service account key.
if (!admin.apps.length) {
  admin.initializeApp();
}

export const adminDb = admin.firestore();
