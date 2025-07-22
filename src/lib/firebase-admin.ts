import * as admin from 'firebase-admin';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

if (!admin.apps.length) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // This is for local development without the service account key
    // It will have limited permissions.
    console.warn("Firebase Admin SDK not initialized. Service account key is missing.");
    admin.initializeApp();
  }
}

export const adminDb = admin.firestore();
