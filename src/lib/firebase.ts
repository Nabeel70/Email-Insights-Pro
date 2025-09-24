import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDLtdLHWg5nW07lFUlcmqsa90WKjTHMtlM",
  authDomain: "email-insights-pro-lcd3q.firebaseapp.com",
  projectId: "email-insights-pro-lcd3q",
  storageBucket: "email-insights-pro-lcd3q.appspot.com",
  messagingSenderId: "56610768571",
  appId: "1:56610768571:web:04c62c52c047925da14b9e"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
