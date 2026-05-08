import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBhi4YBYiO1azDrl7Oy_i5WMEp4YmvL4OA",
  authDomain: "ust-app-aa616.firebaseapp.com",
  projectId: "ust-app-aa616",
  storageBucket: "ust-app-aa616.firebasestorage.app",
  messagingSenderId: "51015990119",
  appId: "1:51015990119:web:60fe7f96e0e259343bcdc2",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
