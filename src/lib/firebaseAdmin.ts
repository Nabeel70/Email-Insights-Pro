
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    // Try to initialize with service account key from environment variable
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;
    
    if (serviceAccountKey) {
      const serviceAccount = JSON.parse(serviceAccountKey);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
      console.log('Firebase Admin initialized with service account credentials');
    } else {
      // Fallback to default credentials for Firebase hosting
      admin.initializeApp();
      console.log('Firebase Admin initialized with default credentials');
    }
  } catch (error) {
    console.error('Firebase Admin initialization failed:', error);
    // Initialize without credentials - will fail when used but won't crash on import
    try {
      admin.initializeApp();
      console.log('Firebase Admin initialized with default credentials (fallback)');
    } catch (fallbackError) {
      console.error('Firebase Admin fallback initialization also failed:', fallbackError);
    }
  }
}

export { admin };
