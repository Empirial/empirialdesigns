// Goal Setter — merged with the former Request Taker agent. Normalizing the
// raw message AND deciding scope from it were two sequential LLM calls with
// no real reason to be separate: Request Taker's whole job was producing a
// clean_request that Goal Setter immediately consumed and nothing else ever
// read (mentioned_sections_guess was already dead — Goal Setter re-derived
// affected_sections itself, per docs/MULTI_AGENT_ORCHESTRATION.md). One call
// now does both: resolve/normalize the raw input, then scope it — the way a
// sharp PM reads a client email and goes straight to a scoped ticket instead
// of first writing a summary for someone else to re-read. Cuts every edit
// from 3 model calls to 2, every fresh build from 8 to 7, no behavior lost.
// Edit ../02-system-prompts/goalSetter.js to change the dependency rules,
// the affected_sections logic, or the contact-details handling — this file
// only owns the call itself and how the response is parsed/validated.
const { callAgent, SAMPLING_PROFILES } = require('../01-model/provider');
const { extractJson, ALL_SECTIONS, STYLES, clampHue, clampSaturation } = require('../shared');
const { buildSystemPrompt } = require('../02-system-prompts/goalSetter');

async function run(apiKey, model, { intent, rawInput, sectionManifest }) {
  const system = buildSystemPrompt();

  const userContent = JSON.stringify({
    intent,
    raw_input: rawInput,
    current_sections: sectionManifest && sectionManifest.length ? sectionManifest : undefined,
  });

  const raw = await callAgent(apiKey, model, system, userContent, SAMPLING_PROFILES.decision);
  const fallback = { clean_request: rawInput, summary: rawInput, affected_sections: [], section_goals: {} };
  const parsed = extractJson(raw, fallback);

  const cleanRequest = typeof parsed.clean_request === 'string' ? parsed.clean_request : rawInput;

  let affectedSections = Array.isArray(parsed.affected_sections)
    ? parsed.affected_sections.filter((s) => ALL_SECTIONS.includes(s))
    : [];
  const sectionGoals = (parsed.section_goals && typeof parsed.section_goals === 'object') ? parsed.section_goals : {};

  // "create" always means all 6 — enforced here, not trusted to the model.
  if (intent === 'create') {
    affectedSections = [...ALL_SECTIONS];
  }

  // Deterministic safety net, edit-only: if the model came back with no
  // scope at all but the normalized request plainly names a section by its
  // own term, trust the keyword over a missed classification — same
  // reasoning as the recolor net below. Conservative on purpose (exact
  // section-name words only, "about" narrowed to avoid catching ordinary
  // English use of the word) so it never overrides a genuine "hi"/"thanks"
  // no-op, only backs up an actual miss.
  if (intent === 'edit' && affectedSections.length === 0) {
    const SECTION_KEYWORDS = {
      hero: /\bhero\b/i,
      nav: /\bnav(?:igation|bar)?\b/i,
      about: /\babout (?:us|section|page)\b/i,
      services: /\bservices?\b|\boffering/i,
      testimonials: /\btestimonials?\b|\breviews?\b/i,
      footer: /\bfooter\b|\bcopyright\b/i,
    };
    const keywordHits = ALL_SECTIONS.filter((s) => SECTION_KEYWORDS[s] && SECTION_KEYWORDS[s].test(cleanRequest));
    if (keywordHits.length > 0) affectedSections = keywordHits;
  }

  for (const section of affectedSections) {
    if (!sectionGoals[section]) sectionGoals[section] = cleanRequest;
  }

  // Only meaningful for intent === 'create' — the caller (pipeline.js)
  // ignores this on an edit and carries the repo's existing style forward
  // instead, so a style is locked in at creation, never silently reshuffled
  // by a later unrelated edit.
  const style = STYLES.includes(parsed.style) ? parsed.style : 'default';

  // Computed on every call (create and edit alike) — clampHue/clampSaturation
  // guarantee this is always a well-formed object (never garbage from a
  // malformed model response), so pipeline.js and index.js never need a
  // separate validity check on it. Whether it's actually *used* is
  // pipeline.js's call: always on create, only on edit when recolor is true.
  const palette = {
    baseHue: clampHue(parsed.base_hue),
    accentHue: clampHue(parsed.accent_hue),
    accentSaturation: clampSaturation(parsed.accent_saturation),
  };

  // Edit-only, and only true when this edit explicitly asked to change
  // color/theme/branding — see the system prompt. Meaningless on a create
  // (which always uses the fresh palette regardless).
  //
  // Deterministic safety net, not trusted to the model alone: this is the
  // one classification in the whole pipeline that WAS left entirely to the
  // model's own JSON judgment (unlike `intent`, never trusted from the
  // model, or a "create" always forcing all 6 sections in code regardless
  // of what the model returns) — a single missed classification here means
  // a silent no-op (the early-return path above fires: no file changes,
  // just a text reply), which reads as "I asked to change the color and
  // nothing happened." A plain keyword check backs the model up — checked
  // against both the normalized cleanRequest AND the raw user message, not
  // cleanRequest alone: the normalization step is itself an LLM call and
  // can paraphrase "change the colors" away before this regex ever sees it,
  // which would otherwise defeat the whole point of a deterministic net.
  const COLOR_KEYWORDS = /\b(colou?r|palette|hue|shade|theme|re-?colou?r)\b/i;
  const recolor = intent === 'edit' && (parsed.recolor === true || COLOR_KEYWORDS.test(cleanRequest) || COLOR_KEYWORDS.test(rawInput));

  // Edit-only, model-classified (no deterministic keyword net here, unlike
  // recolor/section-name above — "live", "published", "SEO" etc. show up in
  // plenty of genuine content-edit requests too, e.g. "add a live chat
  // widget", so a blind keyword match would false-positive far more than it
  // would catch a real miss). See ../02-system-prompts/goalSetter.js's
  // "Status questions" rule for the actual classification logic.
  const statusQuery = intent === 'edit' && parsed.status_query === true;
  // Enforced, not trusted: a status question is never also a content edit,
  // regardless of what affected_sections the model returned alongside it —
  // pipeline.js's routing depends on this being genuinely empty.
  if (statusQuery) affectedSections = [];

  return {
    cleanRequest,
    summary: typeof parsed.summary === 'string' ? parsed.summary : cleanRequest,
    affectedSections,
    sectionGoals,
    style,
    palette,
    recolor,
    statusQuery,
  };
}

module.exports = { run };
