// Layer 5 (agent loop): the status-query branch of the agent loop. Goal
// Setter (../02-system-prompts/goalSetter.js) classifies a chat message as
// statusQuery when it's asking about publish/SEO/Growth status rather than
// requesting a content edit — pipeline.js routes those here instead of into
// Manager/the Coders, since there's nothing to build, only something to
// answer using real data.
//
// A real (if small) tool-calling loop: one DeepSeek call with the 3
// read-only tools from ../03-tool-definitions/statusTools.js attached: the
// model gets the cached Firestore snapshot up front and decides for itself
// whether it needs to call a tool for a fresher number, or can just answer
// from the snapshot (e.g. "is this published?" never needs a tool call).
// Every tool is read-only (see ../04-tool-execution/statusTools.js's own
// comment) — nothing this loop can do publishes, posts, or connects
// anything, so it's safe to let the model call tools without a
// confirmation step, unlike an action the "trigger scope" decision
// deliberately kept behind a dashboard button.
const { callAgentWithTools, SAMPLING_PROFILES } = require('../01-model/provider');
const { STATUS_TOOLS } = require('../03-tool-definitions/statusTools');
const { executeStatusTool } = require('../04-tool-execution/statusTools');

const SYSTEM_PROMPT = `You are the status assistant for a website-builder AI — you answer a user's question about their site's publish/SEO/Growth status using real data, never invented numbers. You are NOT the section-editing assistant; you never write or change site content, only report status.

You are given "current_status": a cached snapshot of this site's status (publish state, live URL, whether Google reviews/Search Console/uptime monitoring are connected, and the last cached PageSpeed scores). For most questions (is this live? what's my URL? do I have reviews linked? is my domain connected?) this cached snapshot is enough — answer directly from it, do not call a tool. If current_status is the literal string "unknown — this project has no status data yet", the project has no history to report yet — say so plainly (e.g. "I don't have any status on this project yet — that usually means it hasn't been published"), don't call a tool to compensate for it, and never imply that a false/missing field means "connected" or "live".

Call a tool only when the user is asking for a number that goes stale and the cached one might be old or missing — a fresh PageSpeed score, current review text/count, recent search performance, or the real current deployment status. Only call get_google_reviews if googleReviewsLinked is true, and only call get_search_performance if searchConsoleConnected is true — calling them when the snapshot says false will just fail; tell the user honestly that it isn't connected instead (and that connecting it happens from the dashboard's Growth panel, not from chat). Call get_deployment_status when the user is asking whether the site is live/published and current_status.deploymentStatus is anything other than a clean READY or NOT_CONNECTED (i.e. BUILDING, ERROR, or missing) — the cached value can lag a build that finished, or a deploy triggered outside this app.

If a tool call fails or returns an error field, say so plainly rather than making up a plausible-sounding number.

Keep your reply short (1-3 sentences), warm, first-person, direct to the user — never third person, never internal terms like "current_status" or "snapshot".`;

async function answerStatusQuery(apiKey, model, { rawInput, statusSnapshot, ctx }) {
  const userContent = JSON.stringify({ question: rawInput, current_status: statusSnapshot || 'unknown — this project has no status data yet' });
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userContent },
  ];

  const first = await callAgentWithTools(apiKey, model, messages, { tools: STATUS_TOOLS, sampling: SAMPLING_PROFILES.decision });

  if (!first.tool_calls || first.tool_calls.length === 0) {
    return first.content || "I couldn't check that right now.";
  }

  // Real tool-calling protocol: the assistant's own tool_calls message goes
  // back into the transcript verbatim, followed by one 'tool' message per
  // call (matched by tool_call_id) — DeepSeek/OpenAI both require this exact
  // shape before a follow-up call will use the results rather than
  // re-requesting the same tools.
  messages.push({ role: 'assistant', content: first.content || null, tool_calls: first.tool_calls });
  for (const call of first.tool_calls) {
    const result = await executeStatusTool(call.function.name, ctx);
    messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
  }

  const second = await callAgentWithTools(apiKey, model, messages, { tools: STATUS_TOOLS, sampling: SAMPLING_PROFILES.decision });
  return second.content || "I checked, but couldn't put together a clear answer — try asking again.";
}

module.exports = { answerStatusQuery };
