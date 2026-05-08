import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Config is read from environment variables at build time.
// Real values live in .env (gitignored). See .env.example for required keys.
// Note: Firebase client config is a project identifier, not a secret —
// data security is enforced by Firestore Security Rules, not by hiding this config.
export const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);

// Explicit LOCAL persistence: tokens survive page refreshes but are
// stored in IndexedDB by the Firebase SDK (not as raw credentials).
// Firebase tokens are short-lived JWTs rotated automatically — no passwords
// are ever stored in the browser.
setPersistence(auth, browserLocalPersistence).catch(console.error);
