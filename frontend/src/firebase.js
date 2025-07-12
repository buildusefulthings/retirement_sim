// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDx_lianOob43E7SA4-wCqmrC_k2U4zOH0",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "retirement-63227.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "retirement-63227",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "retirement-63227.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "920170886043",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:920170886043:web:efc50c2de256ff6e24a73e",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-MSC9YMD1DL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);