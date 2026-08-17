// Google OAuth — raw REST (no `googleapis` dependency), same reasoning as
// functions/integrations/vercel/client.js: keeps functions/index.js's
// deploy-time discovery from resolving another dependency tree, and matches
// how every other provider in this codebase talks to its API (plain fetch).
const fetch = require('node-fetch');

const SCOPES = [
  'https://www.googleapis.com/auth/webmasters',
  'https://www.googleapis.com/auth/siteverification',
  // Business Profile (integrations/google/businessProfile.js). Anyone who
  // connected Google before this scope was added needs to reconnect —
  // their Search Console access still works either way, this scope is
  // additive, not a replacement.
  'https://www.googleapis.com/auth/business.manage',
].join(' ');

// `state` must round-trip the authenticated uid through Google's redirect so
// googleCallback (functions/index.js) knows whose tokens these are — Google
// itself doesn't know or care about this app's users. Callers sign/verify
// `state` themselves (a bare uid is fine here since the callback re-verifies
// the Firebase session independently before trusting it — see index.js).
function buildAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeCodeForTokens(code) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Google token exchange failed: ${JSON.stringify(body)}`);
  return body; // { access_token, refresh_token, expires_in, scope, token_type }
}

async function refreshAccessToken(refreshToken) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Google token refresh failed: ${JSON.stringify(body)}`);
  return body; // { access_token, expires_in, ... } — no new refresh_token
}

// Returns a valid access token for this user, refreshing first if the saved
// one has expired. `integration` is a google_integrations/{uid} doc
// (unencrypted for now — see the field comment in functions/index.js for
// why that's a known, flagged gap, not an oversight).
async function getValidAccessToken(db, uid, integration) {
  const now = Date.now();
  if (integration.expiryDate && integration.expiryDate > now + 60000) {
    return integration.accessToken;
  }
  if (!integration.refreshToken) {
    throw new Error('Google connection expired — reconnect Google Search.');
  }
  const refreshed = await refreshAccessToken(integration.refreshToken);
  const expiryDate = now + refreshed.expires_in * 1000;
  await db.collection('google_integrations').doc(uid).set(
    { accessToken: refreshed.access_token, expiryDate, updatedAt: new Date().toISOString() },
    { merge: true }
  );
  return refreshed.access_token;
}

module.exports = { SCOPES, buildAuthUrl, exchangeCodeForTokens, refreshAccessToken, getValidAccessToken };
