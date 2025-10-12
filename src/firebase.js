// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD2OAq8BWsxNV8Gjb8-6qcqD6V3huAPqM4",
  authDomain: "bo-layout.firebaseapp.com",
  projectId: "bo-layout",
  storageBucket: "bo-layout.firebasestorage.app",
  messagingSenderId: "707620444809",
  appId: "1:707620444809:web:e2558d774cae2c27be8458",
  measurementId: "G-CEE20Q4438"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);