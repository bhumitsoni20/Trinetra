import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyATygHwqbv1lIaQP6O4zIisV_JGgELwdFQ",
  authDomain: "trinetra-abf4f.firebaseapp.com",
  projectId: "trinetra-abf4f",
  storageBucket: "trinetra-abf4f.firebasestorage.app",
  messagingSenderId: "528413618763",
  appId: "1:528413618763:web:72528d46c8371d579cd3ce",
  measurementId: "G-TBV2N8GC27"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
