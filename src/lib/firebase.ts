// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDLtdLHWg5nW07lFUlcmqsa90WKjTHMtlM",
  authDomain: "email-insights-pro-lcd3q.firebaseapp.com",
  projectId: "email-insights-pro-lcd3q",
  storageBucket: "email-insights-pro-lcd3q.firebasestorage.app",
  messagingSenderId: "56610768571",
  appId: "1:56610768571:web:04c62c52c047925da14b9e"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth, getApp };
