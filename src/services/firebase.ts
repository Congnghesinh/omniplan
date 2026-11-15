import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAJL5_jMrgKK6Qa0lpK3wO15Dh69uYF4Tc',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'planning-with-ai-4e4a8.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'planning-with-ai-4e4a8',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'planning-with-ai-4e4a8.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '261107765176',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:261107765176:web:67945990a379998020c94d'
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
