'use server'
import * as admin from 'firebase-admin';

// When running in a managed environment like Firebase App Hosting,
// the SDK automatically discovers the service account credentials.
// We don't need to manually provide a service account key.
if (!admin.apps.length) {
  admin.initializeApp();
}

export const adminDb = admin.firestore();
