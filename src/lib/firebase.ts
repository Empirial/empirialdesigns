import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCj1b3S0Bh-xahs4daFW3XazYw6Secbf2U",
    authDomain: "empirialdesigns.firebaseapp.com",
    projectId: "empirialdesigns",
    storageBucket: "empirialdesigns.firebasestorage.app",
    messagingSenderId: "839951039709",
    appId: "1:839951039709:web:2932da74f8838de4506f34",
    measurementId: "G-C101TNJ82V"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
