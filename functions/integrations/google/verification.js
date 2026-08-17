// Site Verification API — PDF section 18. META-tag verification, not DNS:
// this app controls the generated site's index.html, so inserting a meta
// tag and redeploying is the low-friction path (DNS verification would need
// domain-registrar automation this project explicitly defers — PDF section 44).
const fetch = require('node-fetch');

async function googleApiRequest(accessToken, url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Google API ${options.method || 'GET'} ${url} failed (${res.status}): ${JSON.stringify(body).slice(0, 500)}`);
  }
  return body;
}

// Requests the META verification token for a site. `siteUrl` must be the
// exact URL-prefix property form, e.g. "https://abc-pools.vercel.app/".
async function getVerificationToken(accessToken, siteUrl) {
  const body = await googleApiRequest(accessToken, 'https://www.googleapis.com/siteVerification/v1/token', {
    method: 'POST',
    body: JSON.stringify({
      site: { type: 'SITE', identifier: siteUrl },
      verificationMethod: 'META',
    }),
  });
  return body.token; // insert as <meta name="google-site-verification" content="TOKEN">
}

// Asks Google to check the META tag is actually live and confirms
// ownership. Must be called only after the tag has been committed and the
// production deployment has actually gone out (PDF section 18's flow).
async function verifySite(accessToken, siteUrl) {
  return googleApiRequest(accessToken, 'https://www.googleapis.com/siteVerification/v1/webResource', {
    method: 'POST',
    body: JSON.stringify({
      site: { type: 'SITE', identifier: siteUrl },
      verificationMethod: 'META',
    }),
  });
}

module.exports = { getVerificationToken, verifySite, googleApiRequest };
