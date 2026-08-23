// Layer 4: tool execution for the 3 tools defined in
// ../03-tool-definitions/statusTools.js. Thin wrappers over the existing
// integration modules (functions/integrations/**) — reuses the exact same
// live-data code paths the dashboard's own SEO/Growth panels call, so a
// chat answer and a dashboard number can never disagree about how they're
// computed. Every function here is read-only: none of them publish, post,
// connect, or otherwise mutate anything, matching the "status-aware only"
// scope decision (actions stay button-triggered — see ../README.md).
//
// `ctx` is built by the caller (functions/index.js's aiChat) once per chat
// turn from data it already has: { repo, uid, db, getValidAccessToken }.
// This file deliberately doesn't import index.js or call
// admin.initializeApp() itself — ctx.db is index.js's already-initialized
// Firestore instance, passed down rather than re-derived, so there's one
// Firebase Admin bootstrap in the whole codebase, not two.
const { runPageSpeed } = require('../../integrations/google/pagespeed');
const { getPlaceReviews } = require('../../integrations/google/places');
const { getSearchAnalytics } = require('../../integrations/google/searchConsole');
const { getDeployment, mapReadyState } = require('../../integrations/vercel/publish');

// Same read-refresh-and-self-heal logic as functions/index.js's own
// getDeploymentStatus Cloud Function (the one BuilderPage.tsx/Growth.tsx
// call on page load) — duplicated rather than shared because index.js
// isn't a module this agent pipeline imports (see this file's own header
// comment on why ctx is passed in rather than admin re-initialized here).
async function getDeploymentStatusLive(ctx) {
  if (!ctx.repo.vercel_deployment_id) return { status: ctx.repo.vercel_deployment_status || 'NOT_CONNECTED' };
  const deployment = await getDeployment(ctx.repo.vercel_deployment_id);
  const status = mapReadyState(deployment.readyState);
  const productionUrl = deployment.url ? `https://${deployment.url}` : ctx.repo.vercel_production_url;
  if (status !== ctx.repo.vercel_deployment_status) {
    try {
      await ctx.db.collection('user_repos').doc(ctx.repoId).set({
        vercel_deployment_status: status,
        vercel_production_url: status === 'READY' ? productionUrl : ctx.repo.vercel_production_url,
      }, { merge: true });
    } catch (e) {
      console.error('getDeploymentStatusLive: failed to cache result:', e);
    }
  }
  return { status, url: productionUrl };
}

async function getPagespeedScore(ctx) {
  const liveUrl = ctx.repo.vercel_production_url || ctx.repo.deploy_url;
  if (!liveUrl) return { error: 'Not published yet — there is no live URL to check.' };
  const result = await runPageSpeed(liveUrl, 'mobile');
  // Best-effort cache refresh, same field pageSpeedAudit's own Cloud
  // Function writes — a chat-triggered check should leave the dashboard's
  // cached number as fresh as a button-triggered one would.
  try {
    await ctx.db.collection('user_repos').doc(ctx.repoId).set({ pagespeed_audit: result }, { merge: true });
  } catch (e) {
    console.error('getPagespeedScore: failed to cache result:', e);
  }
  return result;
}

async function getGoogleReviews(ctx) {
  if (!ctx.repo.google_place_id) return { error: 'No Google Business listing linked yet.' };
  return getPlaceReviews(ctx.repo.google_place_id);
}

async function getSearchPerformance(ctx) {
  if (!ctx.repo.google_search_console_property) return { error: 'Google Search Console is not connected yet.' };
  const integrationSnap = await ctx.db.collection('google_integrations').doc(ctx.uid).get();
  if (!integrationSnap.exists) return { error: 'Google Search Console is not connected yet.' };
  const accessToken = await ctx.getValidAccessToken(ctx.db, ctx.uid, integrationSnap.data());
  return getSearchAnalytics(accessToken, ctx.repo.google_search_console_property);
}

const EXECUTORS = {
  get_deployment_status: getDeploymentStatusLive,
  get_pagespeed_score: getPagespeedScore,
  get_google_reviews: getGoogleReviews,
  get_search_performance: getSearchPerformance,
};

// Runs one model-requested tool call by name. Never throws past this point
// on a bad/unknown tool call or a downstream failure — a status lookup
// failing should degrade to "I couldn't check that right now" in the chat
// reply, not break the whole turn the way a section-edit failure wouldn't
// either (see 05-agent-loop/manager.js's own per-section isolation).
async function executeStatusTool(name, ctx) {
  const fn = EXECUTORS[name];
  if (!fn) return { error: `Unknown tool: ${name}` };
  try {
    return await fn(ctx);
  } catch (error) {
    console.error(`executeStatusTool(${name}) failed:`, error);
    return { error: error.message || 'Lookup failed' };
  }
}

module.exports = { executeStatusTool };
