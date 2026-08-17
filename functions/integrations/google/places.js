// Places API (New) — API-key auth, not OAuth (a business's own reviews are
// public data; no user consent flow needed to read them). Used to replace
// agents/coders/testimonials.js's AI-invented quotes with a real business's
// actual Google reviews — see pipeline.js's realReviews wiring.
const fetch = require('node-fetch');

const PLACES_API = 'https://places.googleapis.com/v1';

function requireApiKey() {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error('GOOGLE_PLACES_API_KEY is not configured');
  return key;
}

// One-time lookup: business name (+ city/address helps disambiguate) ->
// candidate places, so the user can confirm which one is theirs before a
// placeId gets linked to their repo. Never auto-links without confirmation
// — a wrong match would put a stranger's reviews on someone's site.
async function findPlace(query) {
  const res = await fetch(`${PLACES_API}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': requireApiKey(),
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount',
    },
    body: JSON.stringify({ textQuery: query }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Places search failed (${res.status}): ${JSON.stringify(body).slice(0, 500)}`);

  return (body.places || []).map((p) => ({
    placeId: p.id,
    name: p.displayName && p.displayName.text,
    address: p.formattedAddress,
    rating: p.rating,
    reviewCount: p.userRatingCount,
  }));
}

// Google returns at most 5 reviews per place through this API — plenty for
// the fixed 3-quote testimonials section, with 1-2 spare to pick the best.
async function getPlaceReviews(placeId) {
  const res = await fetch(`${PLACES_API}/places/${encodeURIComponent(placeId)}`, {
    headers: {
      'X-Goog-Api-Key': requireApiKey(),
      'X-Goog-FieldMask': 'displayName,rating,userRatingCount,reviews',
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Place details failed (${res.status}): ${JSON.stringify(body).slice(0, 500)}`);

  const reviews = (body.reviews || [])
    .filter((r) => r.text && r.text.text)
    .map((r) => ({
      name: (r.authorAttribution && r.authorAttribution.displayName) || 'Google user',
      avatarUrl: (r.authorAttribution && r.authorAttribution.photoUri) || null,
      rating: r.rating,
      text: r.text.text,
      relativeTime: r.relativePublishTimeDescription || 'Google review',
    }));

  return {
    name: body.displayName && body.displayName.text,
    rating: body.rating,
    reviewCount: body.userRatingCount,
    reviews,
  };
}

module.exports = { findPlace, getPlaceReviews };
