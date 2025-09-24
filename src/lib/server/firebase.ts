
import * as admin from 'firebase-admin';

let isInitialized = false;
let initError: Error | null = null;

// Check if the app is already initialized
if (!admin.apps.length) {
    try {
        // When deployed to App Hosting, the service account credentials are 
        // automatically available in the environment. The SDK can be initialized
        // without any arguments.
        admin.initializeApp();
        isInitialized = true;
        console.log("Firebase Admin SDK initialized successfully in production mode.");
    } catch (error) {
        console.log("Firebase Admin SDK not available in production mode, trying local credentials...");
        // This fallback is for local development, where you'd use a service account file.
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;
        if (serviceAccountKey) {
             try {
                const serviceAccount = JSON.parse(serviceAccountKey);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
                isInitialized = true;
                console.log("Firebase Admin SDK initialized successfully with local service account.");
             } catch (e) {
                 console.warn("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY_JSON or initializing with it:", e);
                 initError = e as Error;
             }
        } else {
            console.log("FIREBASE_SERVICE_ACCOUNT_KEY_JSON is not set. Firebase Admin SDK not available for local development.");
            initError = new Error("Firebase Admin SDK not configured for local development");
        }
    }
}

// Safe exports that won't crash if Firebase isn't initialized
export const adminDb = isInitialized ? admin.firestore() : null;
export const adminAuth = isInitialized ? admin.auth() : null;
export const adminApp = isInitialized ? admin.app() : null;
export { admin, isInitialized, initError };
