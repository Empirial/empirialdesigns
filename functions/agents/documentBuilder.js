// Single-call agent that turns a raw prompt into a structured document —
// a title plus an ordered list of {heading, body} sections. Unlike the
// website pipeline (goalSetter -> manager -> per-section coders, see
// docs/MULTI_AGENT_ORCHESTRATION.md), a document is one linear
// piece of writing, not several independently-generated page sections that
// need a wireframe assigned and a manifest tracked — so this stays a single
// DeepSeek call instead of reusing that whole pipeline's machinery.
const { callAgent, extractJson } = require('./shared');

const SYSTEM_PROMPT = `You are a professional document writer. Given a request, produce a well-structured document as JSON.

Respond with ONLY a JSON object of this exact shape, no commentary, no code fences:
{
  "title": "Document Title",
  "sections": [
    { "heading": "Section Heading", "body": "One or more paragraphs of body text. Use \\n\\n between paragraphs." }
  ]
}

Write real, specific, well-organized content appropriate to the request (e.g. a report, proposal, letter, summary, memo). Aim for 3-6 sections. Do not include a "Title" section of its own — the top-level title field already covers that.`;

const FALLBACK = {
  title: 'Untitled document',
  sections: [{ heading: 'Content', body: 'Content could not be generated. Please try again.' }],
};

/**
 * @param {string} apiKey - DEEPSEEK_API_KEY.
 * @param {string} model - DEEPSEEK_MODEL.
 * @param {{ prompt: string }} opts
 * @returns {Promise<{ title: string, sections: { heading: string, body: string }[] }>}
 */
async function run(apiKey, model, { prompt }) {
  const raw = await callAgent(apiKey, model, SYSTEM_PROMPT, prompt);
  const parsed = extractJson(raw, FALLBACK);

  const title = typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : FALLBACK.title;
  const sections = Array.isArray(parsed.sections) && parsed.sections.length
    ? parsed.sections
        .filter((s) => s && typeof s.heading === 'string' && typeof s.body === 'string')
        .map((s) => ({ heading: s.heading.trim(), body: s.body.trim() }))
        .filter((s) => s.heading && s.body)
    : [];

  return { title, sections: sections.length ? sections : FALLBACK.sections };
}

module.exports = { run };
