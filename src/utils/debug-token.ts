import { auth } from '@/integrations/firebase/config';

export async function getAccessToken() {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    console.log('Your Firebase ID token:', token);
    return token;
  }
  console.log('No active session found. Please log in first.');
  return null;
}
