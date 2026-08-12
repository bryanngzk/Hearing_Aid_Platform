// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore'; 
import { getAuth } from 'firebase/auth'; 

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDCbqSKP3OUn27hoODKki0sCXZk1ZVZzG4",
  authDomain: "hearbridge-dev.firebaseapp.com",
  projectId: "hearbridge-dev",
  storageBucket: "hearbridge-dev.firebasestorage.app",
  messagingSenderId: "374034734264",
  appId: "1:374034734264:web:9cd45a7bb4f95ee819684d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app); 
export const auth = getAuth(app);