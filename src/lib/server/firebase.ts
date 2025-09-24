
import * as admin from 'firebase-admin';

// Check if the app is already initialized
if (!admin.apps.length) {
    try {
        // When deployed to App Hosting, the service account credentials are 
        // automatically available in the environment. The SDK can be initialized
        // without any arguments.
        admin.initializeApp();
        console.log("Firebase Admin SDK initialized successfully in production mode.");
    } catch (error) {
        console.error("Failed to initialize Firebase Admin SDK in production mode, falling back to local.", error);
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
             } catch (e) {
                 console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY_JSON or initializing with it.", e);
             }
        } else {
            console.error("FIREBASE_SERVICE_ACCOUNT_KEY_JSON is not set. Firebase Admin SDK could not be initialized.");
        }
    }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminApp = admin.app();
export { admin };
