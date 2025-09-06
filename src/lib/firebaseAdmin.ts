
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    // For deployed Firebase environments, try default credentials first
    admin.initializeApp();
    console.log('Firebase Admin initialized with default credentials');
  } catch (error) {
    console.log('Default Firebase credentials not available, this is normal for local development');
    console.log('Firebase Admin will be available when deployed to Firebase hosting');
  }
}

export { admin };
