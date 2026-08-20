// Layer 6: memory/context — a cheap, Firestore-only snapshot of a repo's
// current Publish/SEO/Growth status, built entirely from fields already on
// the repo doc (no external API call, no added latency/cost — the doc is
// already fetched for section_manifest/style/palette on every chat turn).
// Passed into Goal Setter as "current_status" so a status question ("is
// this live?", "do I have reviews linked?", "is my domain connected?") can
// usually be answered straight from cache, with no tool call needed at all.
//
// For numbers that go stale fast — PageSpeed score, live review count,
// search performance — this snapshot only carries the last cached value
// (with its own fetchedAt) plus whether a live source is even connected;
// getting a FRESH number is what the read-only tools in
// 03-tool-definitions/statusTools.js are for. Goal Setter is told to set
// statusQuery: true rather than answer from a stale cached number itself —
// see 05-agent-loop/statusAssistant.js, which is what actually calls those
// tools.
function buildRepoStatusSnapshot(repo) {
  if (!repo) return null;
  return {
    published: repo.vercel_deployment_status === 'READY',
    deploymentStatus: repo.vercel_deployment_status || 'NOT_CONNECTED',
    liveUrl: repo.vercel_production_url || repo.deploy_url || null,
    customDomain: repo.custom_domain || null,
    customDomainStatus: repo.custom_domain_status || null,
    googleReviewsLinked: Boolean(repo.google_place_id),
    searchConsoleConnected: Boolean(repo.google_search_console_property),
    analyticsConnected: Boolean(repo.ga_measurement_id),
    uptimeMonitored: Boolean(repo.uptime_monitor_id),
    uptimeStatus: repo.uptime_status || null,
    lastPagespeedAudit: repo.pagespeed_audit
      ? {
          performance: repo.pagespeed_audit.performance,
          seo: repo.pagespeed_audit.seo,
          accessibility: repo.pagespeed_audit.accessibility,
          fetchedAt: repo.pagespeed_audit.fetchedAt,
        }
      : null,
  };
}

module.exports = { buildRepoStatusSnapshot };
