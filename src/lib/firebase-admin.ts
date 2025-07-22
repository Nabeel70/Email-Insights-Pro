import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

if (!getApps().length) {
  admin.initializeApp();
}

const adminDb = admin.firestore();

export { adminDb };
