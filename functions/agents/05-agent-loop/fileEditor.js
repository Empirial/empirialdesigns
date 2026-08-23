// Layer 5 (agent loop): the general file-edit branch, for anything Goal
// Setter classifies outside the 6 fixed section files (goals.fileFix — see
// ../02-system-prompts/goalSetter.js's "File fixes" rule). Structurally the
// same real tool-calling loop as statusAssistant.js (list/read tools,
// bounded rounds, a final non-tool answer) — the difference is the final
// answer here is prose + <file> blocks (this agent can actually change the
// project), not just a status report, and it runs alongside Manager's
// section Coders (pipeline.js), not instead of the no-op branch they share.
const { callAgentWithTools, SAMPLING_PROFILES } = require('../01-model/provider');
const { FILE_TOOLS } = require('../03-tool-definitions/fileTools');
const { executeFileTool } = require('../04-tool-execution/fileTools');
const { buildSystemPrompt } = require('../02-system-prompts/fileEditor');
const { parseFileBlocks, stripFileBlocksFromText } = require('../shared');

// Bounds cost/latency on a request that keeps calling tools instead of
// concluding — past this many rounds, the next call goes out with no tools
// offered at all, so the model is forced to give its final answer with
// whatever it's already read rather than looping indefinitely.
const MAX_TOOL_ROUNDS = 5;

// This agent can write anywhere in the project (unlike a section Coder,
// hardcoded to one path), so it gets a real safety check instead of trusting
// the model's own restraint — the system prompt asks nicely, this enforces
// it.
function isSafePath(path) {
  if (!path || typeof path !== 'string') return false;
  const p = path.replace(/^\/+/, '');
  if (!p || p.includes('..')) return false;
  if (p === '.git' || p.startsWith('.git/')) return false;
  if (p.startsWith('node_modules/')) return false;
  if (p === '.env' || p.endsWith('/.env')) return false;
  return true;
}

// The 6 section Coders own these paths (dispatched in parallel by
// pipeline.js's manager.dispatch call, same turn) — dropped here rather than
// trusted to the prompt alone, so a model that ignores the "never touch
// those 6 files" instruction can't race a Coder's own write for the same
// path within one turn. Coder output always wins for these; this agent's
// version of the same path (if it ignored the prompt) is silently dropped.
function isOwnedBySectionCoder(path, sectionFilePaths) {
  return sectionFilePaths.includes(path.replace(/^\/+/, ''));
}

// Defensive cap on how much one turn can touch — matches the spirit of
// Manager's per-section isolation (one failure/one agent shouldn't be able
// to rewrite the whole project in a single turn).
const MAX_FILES_PER_TURN = 8;

/**
 * @param {string} apiKey
 * @param {string} model
 * @param {object} opts
 * @param {string} opts.rawInput - the user's request (Goal Setter's
 *   clean_request is fine here too — this agent re-reads it fresh, same as
 *   every Coder does with its own section goal).
 * @param {() => Promise<string[]>} opts.listFiles - every real file path in
 *   the project right now.
 * @param {(path: string) => Promise<string>} opts.getFileContent - one
 *   file's current content ('none — new file' if it doesn't exist).
 * @param {string[]} opts.sectionFilePaths - the 6 fixed section file paths
 *   (Object.values(SECTION_FILES) from ../shared.js), so this agent's
 *   output never collides with a Coder editing the same file this turn.
 * @returns {Promise<{summary: string, files: Array<{section: null, path: string, content: string}>}>}
 */
async function run(apiKey, model, { rawInput, listFiles, getFileContent, sectionFilePaths }) {
  const system = buildSystemPrompt();
  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: rawInput },
  ];

  const ctx = { listFiles, getFileContent };
  let response;
  let rounds = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const offerTools = rounds < MAX_TOOL_ROUNDS;
    response = await callAgentWithTools(apiKey, model, messages, {
      tools: offerTools ? FILE_TOOLS : undefined,
      sampling: SAMPLING_PROFILES.decision,
    });

    if (!response.tool_calls || response.tool_calls.length === 0) break;
    if (!offerTools) break; // no tools were offered this round — nothing to execute, take whatever content came back

    messages.push({ role: 'assistant', content: response.content || null, tool_calls: response.tool_calls });
    for (const call of response.tool_calls) {
      let args = {};
      try { args = JSON.parse(call.function.arguments || '{}'); } catch { /* malformed args from the model — treat as empty */ }
      const result = await executeFileTool(call.function.name, args, ctx);
      messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
    }
    rounds++;
  }

  const finalText = response.content || '';
  const summary = stripFileBlocksFromText(finalText) || "I looked into it but couldn't find a fix with the files available.";
  const files = parseFileBlocks(finalText)
    .filter((f) => isSafePath(f.path))
    .filter((f) => !isOwnedBySectionCoder(f.path, sectionFilePaths))
    .slice(0, MAX_FILES_PER_TURN)
    .map((f) => ({ section: null, path: f.path.replace(/^\/+/, ''), content: f.content }));

  return { summary, files };
}

module.exports = { run };
