// Layer 1: Model / provider config — the one place that knows which LLM
// backend the whole pipeline talks to and how a call is actually made.
// Every agent (Goal Setter, the 6 Coders) calls callAgent(); nothing else in
// the pipeline touches fetch/DEEPSEEK_URL/sampling params directly. Swapping
// providers (or adding a second one) means editing only this file.
//
// Was OpenRouter (kept the free-tier model's 50-requests/day account-wide
// cap from being usable beyond solo testing — one full-site rebrand alone
// can burn 8+ of those 50). DeepSeek's API is OpenAI-compatible, same
// request/response shape, so this was the only file that needed to change
// when the switch happened.
const fetch = require('node-fetch');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

// Eval recording/replay seam — see
// ../10-evaluation-observability/run-eval.js's --mode flag. This is the one
// place every agent's LLM call actually goes through (see this file's own
// header comment), so it's the cleanest place to intercept a call for the
// free replay tier without threading a fixture id through goalSetter.js /
// runCoder.js / the pipeline just for eval's sake. Off (null) in every real
// request path — only run-eval.js ever calls setEvalMode.
let evalMode = null; // null | 'record' | 'replay'
let evalRecordingsDir = null;

function setEvalMode(mode, recordingsDir) {
  evalMode = mode;
  evalRecordingsDir = recordingsDir;
}

// The recording key is a hash of exactly what was sent, not a fixture name —
// fixtures.js already gives each case a fixed, deterministic input, so the
// same call always hashes to the same key whether run-eval.js is recording
// or replaying, with no id-plumbing needed anywhere else in the pipeline.
function recordingKeyFor(payload) {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 20);
}

function recordingPathFor(key) {
  return path.join(evalRecordingsDir, `${key}.json`);
}

function readRecording(key, payload) {
  const file = recordingPathFor(key);
  if (!fs.existsSync(file)) {
    throw new Error(
      `No recording for this call (key ${key}) — run "npm run eval:record" after any prompt change ` +
      `before replaying. Payload was: ${JSON.stringify(payload).slice(0, 200)}...`
    );
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeRecording(key, payload, result) {
  fs.mkdirSync(evalRecordingsDir, { recursive: true });
  fs.writeFileSync(recordingPathFor(key), JSON.stringify({ payload, result }, null, 2));
}

// Sampling profiles — every agent used to share one fixed temperature:0.7
// regardless of what kind of call it was. Split into two, since the two
// kinds of call want opposite things:
//   'decision' — Goal Setter. Returns a strict JSON shape that downstream
//     code parses and trusts (affected_sections, section_goals,
//     style/palette) — low temperature/top_p keeps the model literal and
//     consistent instead of creatively reinterpreting the request.
//     frequency/presence penalty stay at 0: there's no repeated prose here
//     to discourage repeating.
//   'copy' — the 6 Coders. They're writing marketing copy into a handful of
//     {{TOKEN}} fields — higher temperature/top_p gives more natural
//     variety, and a mild frequency/presence penalty discourages the same
//     word/phrase showing up twice across a small set of fields (e.g. the
//     headline and the CTA both reaching for "amazing").
// Override per-call by passing a different profile (or a one-off object) as
// callAgent's 5th argument; these are just the defaults for the two
// existing call sites (goalSetter.js uses 'decision', coders/runCoder.js
// uses 'copy').
const SAMPLING_PROFILES = {
  decision: { temperature: 0.3, top_p: 0.9, frequency_penalty: 0, presence_penalty: 0 },
  copy: { temperature: 0.8, top_p: 0.95, frequency_penalty: 0.3, presence_penalty: 0.1 },
};

// jsonMode: pass true for a caller whose contract is "the whole response IS
// one JSON object" (Goal Setter, the 6 Coders) — sets response_format:
// {type: 'json_object'} on the wire. DeepSeek's API (confirmed against its
// own docs, api-docs.deepseek.com/guides/json_mode) only supports this
// plain json_object mode, NOT OpenAI's newer json_schema/structured-outputs
// mode — there is no enum/required-field/type enforcement available here,
// only a guarantee that the response is syntactically valid JSON (no prose
// wrapper, no ```fence, no truncated object). That's a real, useful
// guarantee — extractJson (../shared.js) no longer needs its brace-slicing
// fallback for the common case — but it does NOT validate which keys are
// present or that e.g. affected_sections only contains real section ids.
// Concretely: this cannot replace goalSetter.js's deterministic keyword
// nets (recolor/file_fix/section-name/map) — those exist to catch the
// model's own SEMANTIC classification judgment being wrong, not its JSON
// syntax; json_object mode fixes the latter, not the former, and no
// response_format value DeepSeek exposes today can enforce the former. Per
// DeepSeek's own docs, the word "json" must appear somewhere in the prompt
// when this is set — every caller here already says "Respond with JSON
// only", so no prompt change was needed to satisfy that.
async function callAgent(apiKey, model, systemPrompt, userContent, sampling = SAMPLING_PROFILES.decision, jsonMode = false) {
  const responseFormat = jsonMode ? { type: 'json_object' } : undefined;
  const key = evalMode ? recordingKeyFor({ kind: 'callAgent', model, systemPrompt, userContent, sampling, responseFormat }) : null;
  if (evalMode === 'replay') return readRecording(key, { systemPrompt, userContent }).result;

  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: sampling.temperature,
      top_p: sampling.top_p,
      frequency_penalty: sampling.frequency_penalty,
      presence_penalty: sampling.presence_penalty,
      ...(responseFormat ? { response_format: responseFormat } : {}),
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Agent call failed (${res.status}): ${detail.slice(0, 300)}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Agent call returned no content');
  if (evalMode === 'record') writeRecording(key, { systemPrompt, userContent }, content);
  return content;
}

// Same wire format as callAgent, but takes a full `messages` array (so a
// caller can append prior turns — a tool call, then its result) and returns
// the raw `message` object instead of just `.content`, since a tool-calling
// turn's useful part is `message.tool_calls`, which may come back alongside
// null/empty content. Only 05-agent-loop/statusAssistant.js uses this today
// — DeepSeek's API is OpenAI-compatible, so `tools`/`tool_choice` follow the
// same shape as OpenAI's function-calling contract. Every other agent
// (Goal Setter, the Coders) has a fixed one-shot JSON contract and has no
// use for a tool loop, so they stay on the simpler callAgent above.
async function callAgentWithTools(apiKey, model, messages, { tools, sampling = SAMPLING_PROFILES.decision } = {}) {
  // Keyed on the whole transcript (not just the latest message) — a
  // tool-calling loop appends assistant/tool messages round by round, so the
  // 2nd/3rd call in one loop has a different, longer `messages` than the
  // 1st; each round needs its own recording.
  const key = evalMode ? recordingKeyFor({ kind: 'callAgentWithTools', model, messages, tools, sampling }) : null;
  if (evalMode === 'replay') return readRecording(key, { messages }).result;

  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      tools,
      temperature: sampling.temperature,
      top_p: sampling.top_p,
      frequency_penalty: sampling.frequency_penalty,
      presence_penalty: sampling.presence_penalty,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Agent call failed (${res.status}): ${detail.slice(0, 300)}`);
  }
  const data = await res.json();
  const message = data.choices?.[0]?.message;
  if (!message) throw new Error('Agent call returned no message');
  if (evalMode === 'record') writeRecording(key, { messages }, message);
  return message;
}

module.exports = { callAgent, callAgentWithTools, setEvalMode, SAMPLING_PROFILES, DEEPSEEK_URL };
