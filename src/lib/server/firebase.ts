
import * as admin from 'firebase-admin';

let isInitialized = false;
let initializationError: string | null = null;

// Check if the app is already initialized
if (!admin.apps.length) {
    try {
        // When deployed to App Hosting, the service account credentials are 
        // automatically available in the environment. The SDK can be initialized
        // without any arguments.
        admin.initializeApp();
        console.log("Firebase Admin SDK initialized successfully in production mode.");
        isInitialized = true;
    } catch (error) {
        console.log("Failed to initialize Firebase Admin SDK in production mode, falling back to local.");
        // This fallback is for local development, where you'd use a service account file.
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;
        if (serviceAccountKey) {
             try {
                const serviceAccount = JSON.parse(serviceAccountKey);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
                console.log("Firebase Admin SDK initialized successfully with local service account.");
                isInitialized = true;
             } catch (e) {
                 console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY_JSON or initializing with it.", e);
                 initializationError = "Invalid service account JSON";
             }
        } else {
            console.log("FIREBASE_SERVICE_ACCOUNT_KEY_JSON is not set. Firebase Admin SDK not available in local development.");
            initializationError = "No Firebase credentials available for local development";
        }
    }
}

// Export functions that check initialization status
export function getAdminDb() {
    if (!isInitialized) {
        throw new Error(`Firebase Admin SDK not initialized: ${initializationError}`);
    }
    return admin.firestore();
}

export function getAdminAuth() {
    if (!isInitialized) {
        throw new Error(`Firebase Admin SDK not initialized: ${initializationError}`);
    }
    return admin.auth();
}

export function getAdminApp() {
    if (!isInitialized) {
        throw new Error(`Firebase Admin SDK not initialized: ${initializationError}`);
    }
    return admin.app();
}

export function isFirebaseAdminAvailable() {
    return isInitialized;
}

export { admin };
