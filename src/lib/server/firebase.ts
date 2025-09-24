
import * as admin from 'firebase-admin';

// Check if the app is already initialized
if (!admin.apps.length) {
    try {
        // First try with default credentials (production)
        admin.initializeApp();
        console.log("Firebase Admin SDK initialized successfully in production mode.");
    } catch (error) {
        console.log("Production mode initialization failed, trying local development mode...");
        
        // For local development, try with service account key
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;
        if (serviceAccountKey) {
            try {
                const serviceAccount = JSON.parse(serviceAccountKey);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
                console.log("Firebase Admin SDK initialized successfully with local service account.");
            } catch (e) {
                console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY_JSON:", e);
                // Initialize with minimal config for development
                admin.initializeApp({
                    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'development-project'
                });
                console.log("Firebase Admin SDK initialized with minimal config for development.");
            }
        } else {
            console.log("No service account found, initializing with minimal config for development...");
            // Initialize with minimal config for development testing
            admin.initializeApp({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'development-project'
            });
            console.log("Firebase Admin SDK initialized with minimal config for development.");
        }
    }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminApp = admin.app();
export { admin };
