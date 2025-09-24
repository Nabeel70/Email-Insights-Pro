
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK for different environments
if (!admin.apps.length) {
  try {
    // Try to initialize with default credentials (works in Firebase hosting/cloud functions)
    admin.initializeApp();
    console.log('Firebase Admin initialized with default credentials');
  } catch (error) {
    console.log('Default Firebase credentials not available, this is normal for local development');
    // For local development, we'll handle this gracefully
    try {
      // Try to initialize without credentials for development
      admin.initializeApp({
        projectId: 'development-mode'
      });
      console.log('Firebase Admin initialized in development mode');
    } catch (devError) {
      console.log('Firebase Admin could not be initialized, will run without Firebase storage');
    }
  }
}

export { admin };
