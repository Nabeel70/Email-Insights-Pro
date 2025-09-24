
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    // For deployed Firebase environments, try default credentials first
    admin.initializeApp();
    console.log('Firebase Admin initialized with default credentials');
  } catch (error) {
    console.log('Default Firebase credentials not available, trying service account key...');
    
    try {
      // For local development, use service account key from environment
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;
      
      if (serviceAccountKey) {
        const serviceAccount = JSON.parse(serviceAccountKey);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id
        });
        console.log('Firebase Admin initialized with service account key');
      } else {
        throw new Error('No Firebase credentials available');
      }
    } catch (initError) {
      console.error('Failed to initialize Firebase Admin:', initError);
      throw initError;
    }
  }
}

export const adminDb = admin.firestore();
export { admin };
