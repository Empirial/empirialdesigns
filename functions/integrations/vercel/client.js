// Thin Vercel REST client — raw fetch, not @vercel/sdk. Matches this
// codebase's existing pattern for every other provider (GitHub in
// ../../index.js, DeepSeek in ../../agents/shared.js): a small typed wrapper
// over fetch rather than a provider SDK, which keeps functions/index.js's
// deploy-time static-analysis discovery (see the require-timing comment at
// the top of index.js) from having to resolve another dependency tree.
const fetch = require('node-fetch');

const VERCEL_API = 'https://api.vercel.com';

// Appends ?teamId=... (or &teamId=... if the path already has a query
// string) — required on every call when the token belongs to a Vercel Team
// rather than a personal account. Absent for personal-account tokens.
function withTeam(path) {
  const teamId = process.env.VERCEL_TEAM_ID;
  if (!teamId) return path;
  return `${path}${path.includes('?') ? '&' : '?'}teamId=${encodeURIComponent(teamId)}`;
}

// Every call here throws with the real Vercel error body on failure — same
// convention as githubJson in ../../index.js — so publishWebsite can surface
// a specific, human-readable reason (PDF section 40: "invalid token",
// "repository inaccessible", etc.) instead of a bare "publish failed".
async function vercelRequest(path, options = {}) {
  const token = process.env.VERCEL_TOKEN;
  if (!token) throw new Error('VERCEL_TOKEN is not configured');

  const url = `${VERCEL_API}${withTeam(path)}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (body && body.error && body.error.message) || JSON.stringify(body).slice(0, 500);
    const err = new Error(`Vercel ${options.method || 'GET'} ${path} failed (${res.status}): ${message}`);
    err.vercelStatus = res.status;
    err.vercelCode = body && body.error && body.error.code;
    throw err;
  }
  return body;
}

module.exports = { vercelRequest };
