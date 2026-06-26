/**
 * Firebase client (Auth + Firestore) for optional cross-device sync.
 * The web config is PUBLIC by design — safe to embed. Values come from Vite env
 * (VITE_FIREBASE_*); when they're absent the app runs fully offline and the sync
 * UI shows a "not configured" note.
 */
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseEnabled = Boolean(config.apiKey && config.projectId && config.appId);

let app: FirebaseApp | undefined;
export let auth: Auth | undefined;
export let db: Firestore | undefined;
export const googleProvider = new GoogleAuthProvider();

if (firebaseEnabled) {
  app = initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
}
