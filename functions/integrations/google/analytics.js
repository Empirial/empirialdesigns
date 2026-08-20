// Google Analytics 4 (gtag.js) — free, no OAuth needed (a Measurement ID is
// meant to be embedded client-side, same as e.g. a Facebook Pixel id, so a
// simple API-key-style field on the repo doc is enough; unlike Search
// Console/Business Profile this never needs a user consent flow).
//
// Splice boundary comments (ga4:start/end) make upsertAnalyticsTag
// idempotent: setGoogleAnalytics (functions/index.js) can be called any
// number of times — change the id, or clear it to disable — without ever
// double-injecting or leaving a stale script tag behind, regardless of
// what state index.html was already in.
const START = '<!-- ga4:start -->';
const END = '<!-- ga4:end -->';
const MEASUREMENT_ID_RE = /^G-[A-Z0-9]+$/i;

function isValidMeasurementId(id) {
  return typeof id === 'string' && MEASUREMENT_ID_RE.test(id.trim());
}

function renderAnalyticsBlock(measurementId) {
  return `${START}
    <script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}');
    </script>
    ${END}`;
}

// Idempotent: strips any existing ga4:start/end block first (matches
// regardless of which id it held), then inserts a fresh one — or none, if
// measurementId is falsy, which is how GA gets turned off — right before
// </head>. Safe to call against index.html in any prior state: freshly
// generated with no GA block yet, already has one, or had a different id.
function upsertAnalyticsTag(indexHtml, measurementId) {
  const stripped = indexHtml.replace(new RegExp(`\\s*${START}[\\s\\S]*?${END}`), '');
  if (!measurementId) return stripped;
  return stripped.replace('</head>', `    ${renderAnalyticsBlock(measurementId)}\n  </head>`);
}

module.exports = { isValidMeasurementId, upsertAnalyticsTag };
