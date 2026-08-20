// Layer 3: tool definitions — the real thing this layer's README said didn't
// exist yet. Three read-only, live-data tools the chat assistant can call
// when a user asks a status/analytics question that needs a fresher number
// than 06-memory-context/repoStatus.js's cached Firestore snapshot (a
// PageSpeed score, a review count, search performance). Deliberately only
// READ tools — nothing here can publish, post, or connect anything; see
// ../README.md's "trigger scope" note: actions stay button-triggered, chat
// is status-aware only. Schemas follow OpenAI's function-calling shape
// (DeepSeek's API is OpenAI-compatible) — see 01-model/provider.js's
// callAgentWithTools and 05-agent-loop/statusAssistant.js, which is what
// actually sends these and executes a call the model makes.
const STATUS_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_pagespeed_score',
      description: "Runs a fresh Google PageSpeed Insights check on the site's live URL and returns current performance/accessibility/best-practices/SEO scores (0-100). Only useful once the site is published (has a live URL) — check current_status.published first.",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_google_reviews',
      description: "Fetches the business's current real Google reviews (rating, review count, up to 5 recent review texts) from the linked Google Place. Only useful if current_status.googleReviewsLinked is true.",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_search_performance',
      description: 'Fetches the last 28 days of real Google Search Console performance for this site (clicks, impressions, click-through rate, average position, top queries). Only useful if current_status.searchConsoleConnected is true.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
];

module.exports = { STATUS_TOOLS };
