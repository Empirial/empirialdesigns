// Business Profile — three separate Google APIs under one roof, reusing
// verification.js's googleApiRequest + OAuth token plumbing.
//
// Not self-serve like Search Console: production access to these APIs
// requires Google to approve the project (see
// https://developers.google.com/my-business/content/prereqs) — until that's
// granted, calls here will fail with a real 403 from Google, surfaced as-is
// rather than a fake success. Also requires the 'business.manage' OAuth
// scope, added to oauth.js's SCOPES — anyone who connected Google before
// that change needs to reconnect for these calls to work; their existing
// Search Console access is unaffected either way.
const { googleApiRequest } = require('./verification');

const ACCOUNT_MGMT_API = 'https://mybusinessaccountmanagement.googleapis.com/v1';
const BUSINESS_INFO_API = 'https://mybusinessbusinessinformation.googleapis.com/v1';
const LEGACY_POSTS_API = 'https://mybusiness.googleapis.com/v4'; // Posts never moved to the newer APIs.

const LOCATION_READ_MASK = 'name,title,storefrontAddress,phoneNumbers,regularHours,websiteUri,profile';

async function listAccounts(accessToken) {
  const body = await googleApiRequest(accessToken, `${ACCOUNT_MGMT_API}/accounts`);
  return body.accounts || [];
}

// accountName: "accounts/{accountId}", as returned by listAccounts.
async function listLocations(accessToken, accountName) {
  const url = `${BUSINESS_INFO_API}/${accountName}/locations?readMask=${encodeURIComponent(LOCATION_READ_MASK)}`;
  const body = await googleApiRequest(accessToken, url);
  return body.locations || [];
}

// locationName: "locations/{locationId}" (or "accounts/*/locations/*" —
// Google accepts either form for a GET).
async function getLocation(accessToken, locationName) {
  const url = `${BUSINESS_INFO_API}/${locationName}?readMask=${encodeURIComponent(LOCATION_READ_MASK)}`;
  return googleApiRequest(accessToken, url);
}

// Deliberately a narrow, safe subset — hours/phone/website/description —
// not full location CRUD (category, address moves are far more tightly
// gated by Google and easy to get wrong from an unattended edit). `patch`
// keys must be exactly the field paths being changed; updateMask is built
// from them so nothing outside `patch` gets touched.
async function updateLocation(accessToken, locationName, patch) {
  const updateMask = Object.keys(patch).join(',');
  const url = `${BUSINESS_INFO_API}/${locationName}?updateMask=${encodeURIComponent(updateMask)}`;
  return googleApiRequest(accessToken, url, { method: 'PATCH', body: JSON.stringify(patch) });
}

// locationName: "accounts/{accountId}/locations/{locationId}" — the legacy
// v4 Posts endpoint still keys off accountId/locationId as separate path
// segments rather than the newer APIs' single resource name.
async function createLocalPost(accessToken, locationName, post) {
  const parts = locationName.split('/');
  const accountId = parts[1];
  const locationId = parts[3];
  const url = `${LEGACY_POSTS_API}/accounts/${accountId}/locations/${locationId}/localPosts`;
  return googleApiRequest(accessToken, url, { method: 'POST', body: JSON.stringify(post) });
}

module.exports = { listAccounts, listLocations, getLocation, updateLocation, createLocalPost };
