import admin from 'firebase-admin';

// This is a more robust way to initialize the admin SDK in Next.js environments.
// It prevents crashes caused by hot-reloading and module caching.

const BUCKET_NAME = process.env.FIREBASE_STORAGE_BUCKET || 'email-insights-pro-lcd3q.appspot.com';

let app: admin.app.App;

if (!admin.apps.length) {
    try {
        app = admin.initializeApp({
            storageBucket: BUCKET_NAME,
        });
    } catch (error: any) {
        // This error can happen with hot-reloading. If the app already exists,
        // use it instead of crashing.
        if (error.code === 'auth/invalid-credential') {
            console.warn('Admin SDK initialization failed, this is expected during local development with emulators.');
        } else if (error.code !== 'app/duplicate-app') {
            console.error('Firebase admin initialization error', error);
        }
        app = admin.app(); // Get the already-initialized app
    }
} else {
    app = admin.app();
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminStorage = admin.storage();
