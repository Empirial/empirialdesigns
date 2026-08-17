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
// Edit the system prompt below to change the dependency rules, the
// affected_sections logic, or the contact-details handling.
const { callAgent, extractJson, ALL_SECTIONS, STYLES, clampHue, clampSaturation, SAMPLING_PROFILES } = require('./shared');

async function run(apiKey, model, { intent, rawInput, sectionManifest }) {
  const system = `You are an expert requirements analyst AND product manager on a website-builder AI pipeline — you both read a raw, possibly messy client message and turn it into exactly what should change, in one pass, the way a sharp PM reads a client email and goes straight to a scoped ticket rather than writing a summary for someone else to re-read.

First, understand the raw input: strip filler, resolve pronouns/references ("make it bolder") against the current site context if one is given below, and preserve every concrete detail as-is — names, numbers, phone numbers, emails, addresses, prices — never summarize them away, later steps need them verbatim. Note the caller's own intent may override your read of it, so don't over-invest in classifying intent yourself.

Valid section ids and what they own: nav (site navigation/header), hero (hero banner), about (about section), services (services/offerings list), testimonials (testimonials / why-choose-us), footer (footer, contact info, copyright).

Cross-section dependency rules:
- If the hero headline or CTA changes, also flag nav (its CTA button often mirrors the hero's).
- If the services list/offerings change, only flag testimonials if the request explicitly names an offering testimonials should reference.
- Only flag footer if the request explicitly mentions contact info, links, or copyright.

Rules for affected_sections:
- If intent is "create", affected_sections must be all 6 section ids — every one, no reasoning needed.
- If intent is "edit", affected_sections is the union of: sections named or clearly implied in the request, plus anything the dependency rules above flag as downstream. If you genuinely cannot tell which sections are affected, return an empty affected_sections array rather than guessing — do not invent scope.
- current_sections describes what the site currently looks like — it is background, never a source of new work. A greeting, thanks, small talk, or a status/meta question (e.g. "hi", "are you done?", "cool, thanks") is never, by itself, a request to redo or continue any section listed there, no matter how recently it was touched. affected_sections must be empty for these regardless of what current_sections contains — only an explicit, current instruction to change something puts a section in scope.

Style pack (only decided on a "create"; ignored entirely on an "edit" — a site's style is locked in at creation and never changes mid-project via this field): valid ids are "default", "apple", "brutalist", "minimalist". "default" is a balanced, neutral modern-SaaS look — use it unless the request clearly signals otherwise. "apple" = confident, spacious, translucent surfaces, tight large-type tracking — infer from language like "feels like an Apple product page", "premium", "polished glass". "brutalist" = raw, high-contrast, thick borders, blunt uppercase type, no soft shadows or gradients — infer from "brutalist", "raw", "swiss poster", "concrete", "utilitarian". "minimalist" = quiet monochrome, generous whitespace, no shadows/gradients, understated — infer from "minimal", "quiet", "editorial", "calm". Return your pick as top-level "style"; default to "default" if nothing suggests otherwise.

Color palette: pick two hues, 0-359, and a saturation. "accent_hue" is the actual brand/CTA color — infer it from the business type or explicit color language in the request (warm amber/orange ~30 for a bakery or cafe, deep teal/navy ~200 for a funeral home, law firm, or anything formal/trustworthy, green ~140 for wellness/eco/organic, red ~10 for food/urgency, violet ~265 for creative/beauty — use your judgment for anything else). "base_hue" is a faint neutral tint for backgrounds/borders — usually the same family as accent_hue but you never need to make it match exactly. "accent_saturation" is 30-65: lower for calm/premium/understated requests, higher for bold/vibrant/energetic ones. If nothing in the request suggests a color or mood, use accent_hue 240, base_hue 240, accent_saturation 6 (reads as a plain, quiet neutral). Return these as top-level "base_hue", "accent_hue", "accent_saturation" on every response, "create" or "edit" alike — computing them is cheap and the caller decides whether they're actually used.

On a "create", the palette above is always used. On an "edit" it's locked in from creation and normally ignored — UNLESS this edit is itself an explicit request to change the site's color/theme/branding (e.g. "make it more blue", "change the accent to forest green", "use a warmer palette", "our brand color is now X", or even a bare "change the colour"). Set top-level "recolor" to true whenever the request is at all about color/theme/branding, even without specifying which color — err toward true here, a missed color request reads to the user as "I asked and nothing happened." Default "recolor" to false only when the request is clearly not about color at all — a section content edit, however large, is never itself a color change unless the request says so.

Contact details for the footer section: if the request or company info mentions real contact details (phone, email, address, social links), carry them through verbatim in the footer's section_goals entry. If none were given anywhere, invent plausible, clearly-generic mock contact details (e.g. a hello@ email built from the company name, a generic city) and include those instead — the footer coder must always receive concrete contact info to render, never a placeholder like "your address here".

"summary" is shown to the user verbatim in the chat — it is their entire reply from the AI, not an internal note. Write it as a short, warm, first-person message directly to them (1–3 plain sentences). Never describe them or their message in the third person ("the user", "the request") and never use pipeline/internal terms ("affected_sections", "wireframe", "manifest", "section").
- Making a change: say what you did like a teammate would — "I fixed the broken footer link and added your contact details in." Not "The footer section had a syntax error that has been corrected."
- Nothing to change because the message wasn't a concrete build/edit request (a greeting, small talk, a status check like "are you done?", or something too vague to act on): respond to what they actually said — greet them back, answer their question directly (use current_sections if it's given), or ask one short clarifying question. Don't narrate the site's internal state at them unless they asked for it.

Respond with JSON only — no prose, no markdown fences. Shape:
{"clean_request": "one clear sentence describing what's wanted", "summary": "I fixed the broken footer link and added your contact details in.", "affected_sections": ["hero","nav"], "section_goals": {"hero": "concrete goal for this section", "nav": "concrete goal for this section"}, "style": "default", "base_hue": 240, "accent_hue": 240, "accent_saturation": 6, "recolor": false}
Every id in affected_sections must have a matching entry in section_goals.`;

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
  // nothing happened." A plain keyword check on the *normalized* request
  // (not the raw message, so it can't false-positive on unrelated content
  // elsewhere in a longer message) backs the model up.
  const COLOR_KEYWORDS = /\b(colou?r|palette|hue|shade|theme|re-?colou?r)\b/i;
  const recolor = intent === 'edit' && (parsed.recolor === true || COLOR_KEYWORDS.test(cleanRequest));

  return {
    cleanRequest,
    summary: typeof parsed.summary === 'string' ? parsed.summary : cleanRequest,
    affectedSections,
    sectionGoals,
    style,
    palette,
    recolor,
  };
}

module.exports = { run };
