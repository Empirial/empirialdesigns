import { getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Same project as the main site's src/lib/firebase.ts — the staff/CRM
// portal and the AI builder share one Firebase project (empirialdesigns).
// See docs/CRM_STAFF_PORTAL.md for why (was empirialcalls, a separate
// project, before the /staff migration).
const firebaseConfig = {
  apiKey: "AIzaSyCj1b3S0Bh-xahs4daFW3XazYw6Secbf2U",
  authDomain: "empirialdesigns.firebaseapp.com",
  projectId: "empirialdesigns",
  storageBucket: "empirialdesigns.firebasestorage.app",
  messagingSenderId: "839951039709",
  appId: "1:839951039709:web:2932da74f8838de4506f34",
  measurementId: "G-C101TNJ82V",
};

// Reuse the existing app instance across HMR reloads / repeated SSR module evaluation
// instead of calling initializeApp() more than once for the same config.
export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(firebaseApp);

export const storage = getStorage(firebaseApp);

// Analytics only works in the browser (it reads `window`/`document`), so it must never
// run during SSR — initialize it lazily on the client only, once support is confirmed.
let analytics: Analytics | undefined;
export async function getFirebaseAnalytics(): Promise<Analytics | undefined> {
  if (typeof window === "undefined") return undefined;
  if (analytics) return analytics;
  if (await isSupported()) {
    analytics = getAnalytics(firebaseApp);
  }
  return analytics;
}
