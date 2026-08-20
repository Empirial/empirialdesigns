# The AI website builder, organized by agent layer

This folder is organized around the 10 layers of what makes an LLM call into
a real production agent. Each numbered folder is one layer; `shared.js` is
the one file that doesn't belong to a single layer (see below).

Four layers (3, 7, 8, 9) don't have a dedicated folder with real code in it —
they're cross-cutting infrastructure shared by ~30 other Cloud Functions in
`functions/index.js` that have nothing to do with the website-building agent
(SEO audits, Google Business Profile, Vercel publish, uptime monitoring,
domain connection, etc). Physically extracting those out of `index.js` would
mean touching every one of those unrelated features for a purely
organizational win — not worth the blast radius on live, working code. Each
of those four still gets a folder here, with a short doc pointing at exactly
where its real implementation lives.

## 1 — Model / provider config
[`01-model/provider.js`](./01-model/provider.js)

The one place that knows which LLM backend the pipeline talks to: the
DeepSeek endpoint, the actual `fetch` call, and the two sampling profiles
(`decision` for Goal Setter, `copy` for the Coders). Every agent calls
`callAgent()` from here — nothing else touches `fetch`/the API URl directly.
Swapping providers means editing only this file.

## 2 — System prompts
[`02-system-prompts/goalSetter.js`](./02-system-prompts/goalSetter.js),
[`02-system-prompts/coder.js`](./02-system-prompts/coder.js)

The actual identity/rules text sent with every call, separated from the
orchestration code that calls it. Edit these to change what the model is
told to do — the dependency rules, the affected-sections logic, the
copywriter persona, the response JSON shape — without touching how the
response gets parsed or dispatched.

## 3 — Tool definitions
[`03-tool-definitions/statusTools.js`](./03-tool-definitions/statusTools.js)

Real function-calling now exists, scoped deliberately narrow: 3 read-only
tools (`get_pagespeed_score`, `get_google_reviews`, `get_search_performance`)
the status assistant (layer 5's `statusAssistant.js`) can call when a chat
question needs a fresher number than the cached Firestore snapshot (layer
6). None of them can publish, post, or connect anything — see "Trigger
scope" below for why actions stay off this list. The Coders and Goal Setter
still use a fixed JSON *response shape* instead of real tool-calling (Goal
Setter's `{affected_sections, section_goals, style, ...}`, each Coder's
`{TOKEN: "value", ...}`) — that's a contract the model fills out once, not
a tool it decides whether to call, and there's no reason to change that for
either of them.

## 4 — Tool execution
[`04-tool-execution/templates.js`](./04-tool-execution/templates.js) +
[`04-tool-execution/templates/`](./04-tool-execution/templates/) +
[`04-tool-execution/statusTools.js`](./04-tool-execution/statusTools.js)

Two unrelated things execute here:
- `templates.js` — the one real "tool" a Coder's output gets executed
  against: the prebuilt wireframe template library (72 `.tsx` files, 6
  sections × up to 12 wireframes each). A Coder's LLM call only returns
  copy for `{{TOKEN}}` placeholders; this file loads the chosen template and
  deterministically stamps that copy in. The model never writes or touches
  code.
- `statusTools.js` — the execution side of layer 3's 3 tools. Thin wrappers
  over the existing `functions/integrations/**` modules (same code the
  dashboard's own SEO/Growth panels call), so a chat answer and a dashboard
  number are always computed the same way.
- `templates.js`'s `injectMapEmbed()` — a deterministic (non-LLM) addition
  to a stamped footer: a Google Maps embed keyed to a verified linked Place
  id (never for the footer coder's own invented mock address — see its own
  comment). `coders/runCoder.js` calls it after `stamp()`, footer-only.
  `functions/integrations/google/analytics.js`'s GA4 injection is a sibling
  of this same "deterministic, zero LLM calls" pattern, but lives outside
  `agents/` entirely — it's not part of the section-editing pipeline at all,
  only `functions/index.js`'s standalone `setGoogleAnalytics` endpoint
  (same shape as `setThemeColor`).

### Trigger scope: status-aware chat, button-triggered actions

The chat assistant can answer real questions about a site's Publish/SEO/
Growth status (published? live URL? PageSpeed score? reviews linked?
search performance? domain connected?) using real data — either the cached
Firestore snapshot (layer 6, free) or one of the 3 read-only tools above
(a live API call, only when the cached number might be stale). It
deliberately CANNOT trigger a deploy, a Google Business post, a domain
connection, or enable monitoring from chat — those stay behind their
existing dashboard buttons (`PublishButton.tsx`, the Growth panel's
connect/post actions). A misclassified chat message should never be able to
publish a site or post publicly on a business's behalf; a wrong status
*answer* is a much smaller, easily-corrected mistake than a wrong status
*action*.

## 5 — The agent loop
[`05-agent-loop/`](./05-agent-loop/)

The orchestration: `pipeline.js` (entry point) → `goalSetter.js` (scope the
request) → `manager.js` (assign wireframes, dispatch) →
`coders/runCoder.js` (the shared per-section executor) + `coders/<section>.js`
(one small config file per section — its wireframe descriptions and any
section-specific `extraInstructions`). One call to `runPipeline()` handles
both a fresh build (`intent: 'create'`) and a chat edit (`intent: 'edit'`) —
they're the same loop, not two different code paths; see `pipeline.js`'s own
comment for why that unification matters (it's also what makes edits sync to
GitHub the same way creates do — see `functions/index.js`'s `aiChat`).

## 6 — Memory and context management
[`06-memory-context/repoStatus.js`](./06-memory-context/repoStatus.js)

What state carries forward between turns:
- `section_manifest` (so an edit reuses a section's existing wireframe
  instead of rerolling it), `style` and `palette` (locked at creation,
  carried on every edit unless a recolor is explicit) — read/written
  directly in `functions/index.js`'s `aiChat`/`createWebsite` handlers,
  consumed by `pipeline.js`.
- `repoStatus.js`'s `buildRepoStatusSnapshot()` — a cheap, Firestore-only
  snapshot of Publish/SEO/Growth status (published?, live URL, domain,
  whether Google reviews/Search Console/uptime are connected, last cached
  PageSpeed scores), built fresh every chat turn from data already in hand
  and handed to Goal Setter as `current_status` — see layer 3/4's status
  tools for what happens when this cached snapshot isn't fresh enough.

Still on the roadmap, not yet built: a per-project "what this business is"
context doc (business type, sections, key facts like real pricing) that
every edit call would read, so "change the prices" resolves against real
site context instead of the model re-guessing from a bare instruction each
time. This file is the intended home for that too, once it's built.

## 7 — Limits and guardrails
[`07-guardrails/`](./07-guardrails/)

Lives in `functions/index.js`, shared with every other Cloud Function in
the project (not just the builder):
- `checkRateLimit()` / `RATE_LIMITS` — `index.js:444` / `index.js:464`.
  `aiChat` and `createWebsite` each have their own per-user rate limit
  (`index.js:1039`, `index.js:704`).
- `createWebsite` also caps GitHub repo-name-collision retries at 3
  attempts (`index.js:731`) and runs at a fixed 300s/1GB Cloud Function
  timeout; `aiChat` has no explicit timeout override (default).

## 8 — Error handling and retries
[`08-error-handling/`](./08-error-handling/)

Also in `functions/index.js`:
- `githubJson()` (`index.js:489`, plus a local duplicate inside
  `createWebsite` at `index.js:859`) — wraps every GitHub API call with a
  real `.ok` check and throws the actual GitHub error body on failure,
  instead of trusting an unchecked response.
- `commitFilesToGithub()` (`index.js:512`) — the shared incremental-commit
  helper used by `aiChat`, `requestRepoSync`, and `publishWebsite`.
- Model-call failures throw from `01-model/provider.js`'s `callAgent()`
  with the provider's real error body; `extractJson()`
  (`../shared.js`) falls back to a caller-supplied default shape rather
  than throwing on a malformed model response, so one bad JSON reply
  degrades gracefully instead of crashing the whole request.
- Per-section failure isolation lives in `05-agent-loop/manager.js`'s
  `runOne()` — one coder's own try/catch means one section failing
  doesn't take the other 5 down with it; the user sees
  `[Note: the X update failed — ask me to retry it.]` inline instead of a
  hard error.

## 9 — Streaming and response delivery
[`09-streaming/`](./09-streaming/)

`functions/index.js`'s `aiChat` (`index.js:1095`-`1112`): sets up an SSE
response and wraps the pipeline's `onProgress` callback (plain text +
`<file>` blocks, built by `../shared.js`'s `buildFileBlock`) in the same
`data: {...}` envelope OpenRouter's wire format used, so the existing
frontend parser (`src/features/builder/lib/aiChat.ts`) needed no changes
when the actual model backend swapped from OpenRouter to DeepSeek.
`createWebsite` has no streaming — it's a single blocking request/response,
since there's no live chat UI watching a fresh build happen turn-by-turn.

## 10 — Evaluation and observability
[`10-evaluation-observability/`](./10-evaluation-observability/)

Real gap, not just an unmapped layer: there is no eval suite (no fixed set
of test prompts run against the pipeline to catch a regression before it
ships) and no structured observability beyond `console.error` calls
scattered through `index.js` and each agent file (visible in Cloud
Functions logs, not aggregated anywhere — no per-run cost/latency/token
tracking, no dashboard). See that folder's own note for what would need to
exist.

## `shared.js` — not a layer

[`../shared.js`](./shared.js) holds constants and pure functions used across
more than one layer at once (the fixed 6-section shape, style/palette math,
JSON/code-fence text cleanup) — it doesn't belong to layer 1 or layer 5 or
any other single layer, so it stays a sibling of the numbered folders rather
than living inside one of them.

## What's NOT part of this map

`../documentBuilder.js` (single-call "turn a prompt into a structured
document" agent for the separate Document-mode feature) is not wired to any
live Cloud Function — `index.js` has no `exports.generateDocument` despite
the frontend and `docs/AI_BUILDER_ENGINE.md` describing it as shipped. Left
in place, unmoved by this reorg, since it isn't part of the live website
pipeline right now.
