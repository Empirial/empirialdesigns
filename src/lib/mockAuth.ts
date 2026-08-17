// Lightweight stand-in for a signed-in Firebase user, used by the
// "Instant Mock Login" path on the auth screen so the product can be
// explored without a real account. Firebase's own onAuthStateChanged
// never fires for this session — it's purely a localStorage flag the
// route guards in Platform.tsx and BuilderPage.tsx check as a fallback
// when there's no real `currentUser`.
import type { User } from 'firebase/auth';

const MOCK_LOGIN_KEY = 'empirial_mock_login';

export function isMockSession(): boolean {
  return typeof window !== 'undefined' && localStorage.getItem(MOCK_LOGIN_KEY) === 'true';
}

export function startMockSession(): void {
  localStorage.setItem(MOCK_LOGIN_KEY, 'true');
}

export function endMockSession(): void {
  localStorage.removeItem(MOCK_LOGIN_KEY);
}

// Shaped like just enough of firebase's User for the screens that read
// user.uid / user.email / user.displayName / user.getIdToken(). Cast
// through `unknown` since it deliberately doesn't implement the full
// interface (providerData, refreshToken, etc. — nothing downstream needs them).
export const mockUser = {
  uid: 'mock-demo-user',
  email: 'demo@empirial.com',
  displayName: 'Demo Builder',
  getIdToken: async () => 'mock-id-token',
} as unknown as User;
