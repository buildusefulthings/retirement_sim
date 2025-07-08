// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDx_lianOob43E7SA4-wCqmrC_k2U4zOH0",
  authDomain: "retirement-63227.firebaseapp.com",
  projectId: "retirement-63227",
  storageBucket: "retirement-63227.appspot.com",
  messagingSenderId: "920170886043",
  appId: "1:920170886043:web:efc50c2de256ff6e24a73e",
  measurementId: "G-MSC9YMD1DL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);