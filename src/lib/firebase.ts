// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // This will be replaced by the build process
  authDomain: "email-insights-pro-lcd3q.firebaseapp.com",
  projectId: "email-insights-pro-lcd3q",
  storageBucket: "email-insights-pro-lcd3q.appspot.com",
  messagingSenderId: "360428495252",
  appId: "1:360428495252:web:a959146f228b1e1fb33c5e",
  measurementId: "G-9XG1883J76"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
