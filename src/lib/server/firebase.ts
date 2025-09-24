
import * as admin from 'firebase-admin';

let isInitialized = false;
let initializationError: Error | null = null;

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
        console.log("Firebase Admin SDK not available in development mode, this is normal for local development");
        initializationError = error as Error;
        
        // This fallback is for local development, where you'd use a service account file.
        // It's included for robustness, though the primary fix is for the deployed environment.
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;
        if (serviceAccountKey) {
             try {
                const serviceAccount = JSON.parse(serviceAccountKey);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
                console.log("Firebase Admin SDK initialized successfully with local service account.");
                isInitialized = true;
                initializationError = null;
             } catch (e) {
                 console.log("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY_JSON or initializing with it, continuing without Firebase.", e);
                 initializationError = e as Error;
             }
        } else {
            console.log("FIREBASE_SERVICE_ACCOUNT_KEY_JSON is not set. Running in development mode without Firebase.");
        }
    }
}

// Safe getters that don't throw if Firebase isn't initialized
export function getAdminDb() {
    if (!isInitialized) {
        throw new Error("Firebase Admin SDK is not initialized. This is expected in development mode.");
    }
    return admin.firestore();
}

export function getAdminAuth() {
    if (!isInitialized) {
        throw new Error("Firebase Admin SDK is not initialized. This is expected in development mode.");
    }
    return admin.auth();
}

export function getAdminApp() {
    if (!isInitialized) {
        throw new Error("Firebase Admin SDK is not initialized. This is expected in development mode.");
    }
    return admin.app();
}

export function isFirebaseInitialized() {
    return isInitialized;
}

export function getFirebaseError() {
    return initializationError;
}

export { admin };
