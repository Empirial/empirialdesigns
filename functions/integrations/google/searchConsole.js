// Search Console (Webmasters) API + URL Inspection — PDF sections 19-22.
const { googleApiRequest } = require('./verification');

const WEBMASTERS_API = 'https://www.googleapis.com/webmasters/v3';

// Adds a URL-prefix property (PDF section 19 — domain properties need DNS
// verification, deferred). No-ops with a 200-shaped success if the property
// already exists; Search Console's add-site endpoint is itself idempotent.
async function addSite(accessToken, siteUrl) {
  return googleApiRequest(accessToken, `${WEBMASTERS_API}/sites/${encodeURIComponent(siteUrl)}`, { method: 'PUT' });
}

async function submitSitemap(accessToken, siteUrl, sitemapUrl) {
  await googleApiRequest(
    accessToken,
    `${WEBMASTERS_API}/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`,
    { method: 'PUT' }
  );
  return { submittedAt: new Date().toISOString(), sitemapUrl };
}

// PDF section 21 — last 28 days, dimensioned by query so the dashboard can
// show "top queries" without a second call.
async function getSearchAnalytics(accessToken, siteUrl, { days = 28, rowLimit = 10 } = {}) {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);
  const toDate = (d) => d.toISOString().slice(0, 10);

  const body = await googleApiRequest(
    accessToken,
    `${WEBMASTERS_API}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      body: JSON.stringify({
        startDate: toDate(start),
        endDate: toDate(end),
        dimensions: ['query'],
        rowLimit,
      }),
    }
  );

  const rows = body.rows || [];
  const totals = rows.reduce(
    (acc, row) => ({
      clicks: acc.clicks + row.clicks,
      impressions: acc.impressions + row.impressions,
    }),
    { clicks: 0, impressions: 0 }
  );

  return {
    hasData: rows.length > 0,
    clicks: totals.clicks,
    impressions: totals.impressions,
    ctr: totals.impressions > 0 ? totals.clicks / totals.impressions : 0,
    avgPosition: rows.length > 0 ? rows.reduce((s, r) => s + r.position, 0) / rows.length : 0,
    topQueries: rows.map((r) => ({ query: r.keys[0], clicks: r.clicks, impressions: r.impressions })),
  };
}

// PDF section 22 — real Google index status per URL, never fabricated.
// Uses the newer searchconsole.googleapis.com surface (urlInspection isn't
// part of the older webmasters/v3 API).
async function inspectUrl(accessToken, siteUrl, inspectionUrl) {
  const body = await googleApiRequest(accessToken, 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
    method: 'POST',
    body: JSON.stringify({ inspectionUrl, siteUrl }),
  });
  const result = body.inspectionResult && body.inspectionResult.indexStatusResult;
  return {
    url: inspectionUrl,
    coverageState: (result && result.coverageState) || 'UNKNOWN',
    verdict: (result && result.verdict) || 'UNKNOWN',
  };
}

module.exports = { addSite, submitSitemap, getSearchAnalytics, inspectUrl };
