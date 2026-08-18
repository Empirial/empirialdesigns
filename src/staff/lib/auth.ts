import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";

import { db, firebaseApp } from "./firebase";

export const firebaseAuth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

export type AppRole = "admin" | "agent";

const MOCK_SESSION_KEY = "empirial_staff_mock_session";
const STAFF_SESSION_KEY = "empirial_staff_session";

/**
 * TanStack Router runs below the outer React Router `/staff/*` mount. Keep
 * redirect targets in the inner router's coordinate system so a login flow
 * never turns `/staff/admin/dashboard` into `/staff/staff/admin/dashboard`.
 */
export function toStaffRoute(pathname: string): string {
  if (pathname.startsWith("/staff/")) return pathname.slice("/staff".length);
  if (pathname === "/staff") return "/";
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export interface UserProfile {
  uid: string;
  role: AppRole;
  displayName: string;
  email: string | null;
}

function canUseMockSession(): boolean {
  return import.meta.env.DEV && typeof window !== "undefined";
}

export function getMockStaffProfile(): UserProfile | null {
  if (!canUseMockSession()) return null;

  try {
    const raw = window.sessionStorage.getItem(MOCK_SESSION_KEY);
    if (!raw) return null;
    const profile = JSON.parse(raw) as UserProfile;
    return profile.role === "admin" || profile.role === "agent" ? profile : null;
  } catch {
    return null;
  }
}

/** A staff session is intentionally separate from the main website session. */
export function hasStaffSession(): boolean {
  return typeof window !== "undefined" && window.sessionStorage.getItem(STAFF_SESSION_KEY) === "active";
}

/**
 * Called on every successful sign-in path (password, Google, agent's first
 * login after invite, mock/demo). Agents go online automatically here —
 * no more remembering to flip a switch — and get a fresh lastActiveAt so
 * autoOfflineIdleAgents (functions-staff/src/scheduled) doesn't immediately
 * think they've gone idle. Best-effort and fire-and-forget: a write failure
 * here shouldn't block sign-in, and mock/demo uids (mock-agent, mock-admin)
 * are skipped since there's no real agents/{uid} doc for them.
 */
export function establishStaffSession(profile: UserProfile): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(STAFF_SESSION_KEY, "active");
    window.sessionStorage.setItem("empirial_staff_role", profile.role);
  }
  if (profile.role === "agent" && !profile.uid.startsWith("mock-")) {
    void updateDoc(doc(db, "agents", profile.uid), {
      online: true,
      lastActiveAt: serverTimestamp(),
    }).catch(() => {
      // Best-effort — e.g. a brand-new agent whose agents/{uid} doc hasn't
      // finished being created by onUserCreate/inviteUser yet.
    });
  }
}

export function clearStaffSession(): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(STAFF_SESSION_KEY);
    window.sessionStorage.removeItem("empirial_staff_role");
  }
}

/**
 * Heartbeat call while an agent has the app open — see AppShell. Keeps
 * lastActiveAt fresh so autoOfflineIdleAgents doesn't flip a genuinely
 * active session to offline after an hour.
 */
export function touchAgentActivity(uid: string): void {
  if (uid.startsWith("mock-")) return;
  void updateDoc(doc(db, "agents", uid), { lastActiveAt: serverTimestamp() }).catch(() => {});
}

export function startMockStaffSession(role: AppRole): UserProfile {
  if (!canUseMockSession()) {
    throw new Error("Mock staff login is only available in development mode.");
  }

  const profile: UserProfile = {
    uid: `mock-${role}`,
    role,
    displayName: role === "admin" ? "Demo Admin" : "Demo Agent",
    email: `${role}@demo.empirial.local`,
  };
  // A previous real session may still be persisted in this browser. Demo
  // mode must be deterministic and must never mix that identity with mock
  // data or protected Firestore reads.
  void signOut(firebaseAuth).catch(() => undefined);
  establishStaffSession(profile);
  window.sessionStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(profile));
  return profile;
}

export function clearMockStaffSession(): void {
  if (typeof window !== "undefined") window.sessionStorage.removeItem(MOCK_SESSION_KEY);
}

// The Firebase Auth SDK's initial "do we have a persisted session" check is
// async (backed by IndexedDB), so `firebaseAuth.currentUser` is unreliably
// null for a moment after page load. We start one `onAuthStateChanged`
// listener for the lifetime of the app, keep the latest value in `latestUser`,
// and expose `getCurrentAuthUser()` for route `beforeLoad` guards to await —
// it resolves once the SDK's first emission has happened, then always
// reflects the live value afterwards (sign-in/out included), so it stays
// correct across navigations rather than freezing the first result forever.
let latestUser: User | null = null;
let readyPromise: Promise<void> | undefined;

function ensureAuthListenerStarted(): Promise<void> {
  if (!readyPromise) {
    readyPromise = new Promise((resolve) => {
      let resolved = false;
      onAuthStateChanged(firebaseAuth, (user) => {
        latestUser = user;
        if (!resolved) {
          resolved = true;
          resolve();
        }
      });
    });
  }
  return readyPromise;
}

export async function getCurrentAuthUser(): Promise<User | null> {
  // No persisted session to check during SSR (no browser storage) — see
  // docs/firebase-architecture.html and the Phase 1 plan for why this is
  // acceptable for now (routes still render mock data server-side; the
  // client-side guard corrects this once the page hydrates in the browser).
  if (typeof window === "undefined") return null;
  await ensureAuthListenerStarted();
  return latestUser;
}

export async function signInWithPassword(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
  return credential.user;
}

/**
 * Covers both the bootstrap-admin case and every regular sign-in: unlike the
 * password paths above, Firebase Auth itself decides whether this is a brand
 * new account or a returning one, so `onUserCreate` fires exactly when it
 * should regardless of caller intent — no separate "sign up" variant needed.
 */
export async function signInWithGoogle(): Promise<User> {
  const credential = await signInWithPopup(firebaseAuth, googleProvider);
  return credential.user;
}

/**
 * Only meaningful before an admin account exists — see the `onUserCreate`
 * Cloud Function (functions/src/index.ts). Any signup after the first is
 * disabled server-side immediately, since there's no invite system yet.
 */
export async function signUpBootstrapAdmin(email: string, password: string): Promise<User> {
  const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  return credential.user;
}

export async function signOutUser(): Promise<void> {
  // Go offline before the auth state actually clears — firebaseAuth.currentUser
  // is only valid up until signOut() resolves. Best-effort: a pure admin has
  // no agents/{uid} doc, and any other failure shouldn't block signing out.
  const uid = firebaseAuth.currentUser?.uid;
  if (uid) {
    try {
      await updateDoc(doc(db, "agents", uid), { online: false });
    } catch {
      // Ignored — see comment above.
    }
  }
  clearStaffSession();
  clearMockStaffSession();
  await signOut(firebaseAuth);
}

/**
 * Backs the login page's "set up admin account" vs "sign in" split — reads
 * the one publicly-readable flag `onUserCreate` maintains (see
 * functions/src/index.ts and firestore.rules). Defaults to "not bootstrapped
 * yet" on any read failure so the setup form is what people see if something
 * is misconfigured, rather than silently hiding it behind a normal sign-in
 * form nobody can use yet.
 */
export async function isAdminAlreadyBootstrapped(): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, "meta/public"));
    return snap.exists() && snap.data().adminBootstrapped === true;
  } catch {
    return false;
  }
}

/**
 * Reads the caller's own `staffUsers/{uid}` profile doc, retrying briefly if it
 * doesn't exist yet. Needed right after signup: `onUserCreate` provisions
 * the doc asynchronously (it's a Cloud Function reacting to account
 * creation, not something the client call for signup waits on), so the very
 * first read can land a moment too early. Existing accounts signing back in
 * find the doc on the first attempt.
 */
export async function waitForOwnProfile(
  uid: string,
  { retries = 6, delayMs = 500 }: { retries?: number; delayMs?: number } = {},
): Promise<UserProfile | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const snap = await getDoc(doc(db, "staffUsers", uid));
    if (snap.exists()) {
      const data = snap.data();
      return {
        uid,
        role: data.role as AppRole,
        displayName: (data.displayName as string | undefined) ?? data.email ?? uid,
        email: (data.email as string | null | undefined) ?? null,
      };
    }
    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return null;
}
