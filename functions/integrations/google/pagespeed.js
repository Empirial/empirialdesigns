// PageSpeed Insights — real Core Web Vitals for a *live* URL, distinct from
// seo/audit.js's auditFiles (which checks committed file content, not a
// deployed page). Works keyless at Google's shared low quota; set
// GOOGLE_PAGESPEED_API_KEY to raise it. No OAuth — this is a public API.
const fetch = require('node-fetch');

const PSI_API = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];

function toScore(category) {
  return category && typeof category.score === 'number' ? Math.round(category.score * 100) : null;
}

// strategy: 'mobile' | 'desktop' — mobile is the more honest default for a
// small-business site, since that's how most of its real visitors arrive.
async function runPageSpeed(url, strategy = 'mobile') {
  const params = new URLSearchParams({ url, strategy });
  for (const c of CATEGORIES) params.append('category', c);
  if (process.env.GOOGLE_PAGESPEED_API_KEY) params.append('key', process.env.GOOGLE_PAGESPEED_API_KEY);

  const res = await fetch(`${PSI_API}?${params.toString()}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`PageSpeed Insights failed (${res.status}): ${JSON.stringify(body).slice(0, 500)}`);
  }

  const categories = (body.lighthouseResult && body.lighthouseResult.categories) || {};
  return {
    strategy,
    performance: toScore(categories.performance),
    accessibility: toScore(categories.accessibility),
    bestPractices: toScore(categories['best-practices']),
    seo: toScore(categories.seo),
    fetchedAt: new Date().toISOString(),
  };
}

module.exports = { runPageSpeed };
