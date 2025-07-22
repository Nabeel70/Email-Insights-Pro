// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "7949263adada561e83961b13fe4ebd15782de970",
  authDomain: "fir-studio-demos-1983.firebaseapp.com",
  projectId: "fir-studio-demos-1983",
  storageBucket: "fir-studio-demos-1983.appspot.com",
  messagingSenderId: "360428495252",
  appId: "1:360428495252:web:3439f7336940e3bee625e9"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
