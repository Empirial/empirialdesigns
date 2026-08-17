// Shared coder executor — the part of "being a coder" that's identical
// across all 6 sections. As of the template library under
// agents/coders/templates/<section>/01.tsx..09.tsx, a coder no longer
// writes code: the wireframe IS real, prebuilt code already. A coder's job
// shrank to writing the business-specific COPY that fills it in — one
// small LLM call that returns JSON (e.g. {"HEADLINE": "...", "CTA_TEXT":
// "..."}), which then gets deterministically stamped into the template's
// {{TOKEN}} placeholders. The code itself is never regenerated, so it can
// never come back broken.
//
// This is NOT the file to open to change one section's behavior — go to
// agents/coders/<section>.js for that (extraInstructions), or edit/add a
// template under agents/coders/templates/<section>/ directly. Only touch
// this file to change something true of every coder at once.
const fs = require('fs');
const path = require('path');
const { callAgent, extractJson, stripCodeFences, SECTION_FILES, SAMPLING_PROFILES } = require('../shared');

const TEMPLATES_DIR = path.join(__dirname, 'templates');
const TOKEN_RE = /\{\{([A-Z0-9_]+)\}\}/g;

// A token used as a bare JSX attribute value — e.g. `href={{NAV_LINK_HREF}}`
// — reads as valid JSX at template-authoring time (a `{...}` expression
// container around an object-literal shorthand `{X}`), but stamp() below
// does a raw string replace of the *entire* `{{TOKEN}}` span, braces
// included. That turns it into `href=#hero`: no braces, no quotes, invalid
// JSX — the exact bug a live generated site hit (see docs/CODE_REVIEW.md
// entry from 2026-08-13). The fix is always the same: wrap the token in a
// template literal, `href={\`{{NAV_LINK_HREF}}\`}`, so what's left after
// stamping is a quoted string no matter what the token resolves to — same
// pattern the EMAIL/PHONE mailto:/tel: links already use everywhere.
// Every existing template was swept clean of the bare form; this check
// exists so a *new* template (a 10th wireframe, a new section) fails loudly
// at load time instead of silently shipping the same landmine again.
const BARE_ATTR_TOKEN_RE = /[a-zA-Z-]+=\{\{[A-Z0-9_]+\}\}/;

function loadTemplate(section, wireframeId) {
  const file = path.join(TEMPLATES_DIR, section, `${String(wireframeId).padStart(2, '0')}.tsx`);
  const source = fs.readFileSync(file, 'utf8');
  const badMatch = source.match(BARE_ATTR_TOKEN_RE);
  if (badMatch) {
    throw new Error(
      `Template ${section}/${wireframeId} has a bare-braced token in attribute position (${badMatch[0]}), ` +
      `which stamp() would turn into invalid JSX (e.g. href=#hero). Wrap it in a template literal instead: ` +
      `${badMatch[0].split('=')[0]}={\`${badMatch[0].split('=')[1]}\`}`
    );
  }
  return source;
}

// Every distinct {{TOKEN}} the template actually uses — a file only ever
// contains the tokens its own layout needs, so this drives exactly what
// gets asked for below, nothing more.
function extractTokens(templateSource) {
  const tokens = new Set();
  let m;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(templateSource)) !== null) tokens.add(m[1]);
  return [...tokens];
}

// Tokens that are never worth an LLM call: image/avatar sources (nothing
// generates real images here — a placeholder image service fill is more
// honest than asking a text model to invent a URL) and the copyright year
// (trivially deterministic). Every other token is real business copy and
// goes to the content-writer call below.
function isAssetToken(token) {
  return token.endsWith('_URL');
}

function assetFallback(token, section) {
  if (token.includes('AVATAR')) return 'https://placehold.co/96x96/e2e8f0/475569?text=%20';
  return `https://placehold.co/960x640/e2e8f0/475569?text=${encodeURIComponent(section)}`;
}

// Per-style voice note appended to every copywriter call when a site was
// assigned a named style pack (see agents/shared.js STYLE_WIREFRAME_ID) —
// the layout tokens already carry the visual language; this keeps the words
// filling them in from clashing with it (e.g. breezy marketing copy dropped
// into a brutalist block reads as a mismatch even if the CSS is right).
const STYLE_VOICE = {
  apple: 'Voice: confident, warm, concise — short declarative sentences, no jargon, no exclamation points. Sell the feeling the product gives, not a feature list.',
  brutalist: 'Voice: blunt, declarative, utilitarian — short fragments over full sentences, no soft marketing adjectives, no hedging.',
  minimalist: 'Voice: quiet, plain, specific — avoid hype words ("amazing", "revolutionary", "game-changing"), let the facts carry it, understatement over emphasis.',
};

async function writeContent(apiKey, model, { section, config, contentTokens, goal, currentContent, manifestContext, wireframeId, isNewLayout, style }) {
  if (contentTokens.length === 0) return {};

  const wireframeDescription = config.wireframes[wireframeId - 1];
  const manifestNote = manifestContext
    ? `\n\nOther sections on this page — for internal links, use on-page anchors matching these (e.g. #hero, #about, #services, #testimonials, #contact), not external pages: ${JSON.stringify(manifestContext)}`
    : '';
  const editNote = !isNewLayout && currentContent && currentContent !== 'none — new file'
    ? `\n\nThis section already exists; write updated copy that applies the goal to what's already there rather than starting from nothing. Current file for reference:\n${currentContent}`
    : '';
  const extra = config.extraInstructions ? `\n\n${config.extraInstructions}` : '';
  const voice = STYLE_VOICE[style] ? `\n\n${STYLE_VOICE[style]}` : '';

  const system = `You are an expert conversion copywriter specializing in ${section} sections for small-business websites — the person a real design agency would hire to write this exact section, not a generic content generator. The layout is already fixed, real, working code (wireframe #${wireframeId}: ${wireframeDescription}) — you never write or touch code. Your only job is the business-specific copy that fills it in.

Goal for this section: ${goal}${editNote}${manifestNote}${extra}${voice}

Typography: use curly quotes (' ' " ") and a real ellipsis (…) rather than straight quotes or three periods. Write in active voice, second person where it reads naturally. Button/link labels must be specific to what they do ("Book a call", "See pricing") — never a bare generic "Learn more" or "Click here".

Respond with JSON only — no prose, no markdown fences, no HTML in the values, plain text only. Exactly this shape, one key per field:
{${contentTokens.map((t) => `"${t}": "..."`).join(', ')}}`;

  const raw = await callAgent(apiKey, model, system, 'Write the content now.', SAMPLING_PROFILES.copy);
  const fallback = {};
  for (const t of contentTokens) fallback[t] = '';
  return extractJson(raw, fallback);
}

// Deterministic string replace — every matched token gets a value, never
// left as literal {{TOKEN}} text. That matters beyond cosmetics: a
// {{TOKEN}} left inside a JSX child position (not a quoted attribute) is
// invalid TypeScript once compiled (JSX reads {{X}} as an object-literal
// expression referencing an undefined identifier X), so an unresolved
// token would break the generated site's build, not just look wrong.
function stamp(templateSource, section, values) {
  return templateSource.replace(TOKEN_RE, (match, token) => {
    if (token === 'COPYRIGHT_YEAR') return String(new Date().getFullYear());
    // A real avatar URL (from applyRealReviews below) wins over the
    // placeholder-image fallback; every other _URL token has no such source
    // and always falls back, since nothing here generates real images.
    if (isAssetToken(token)) return values[token] ? String(values[token]) : assetFallback(token, section);
    const value = values[token];
    return value === undefined || value === null ? '' : String(value);
  });
}

// Overrides the LLM's invented QUOTE_1..3 fields with a business's real
// Google reviews (integrations/google/places.js), when there are enough to
// fill every slot the testimonials templates use. Requires >= 3 on purpose:
// a template always has exactly 3 fixed quote slots (no conditional
// rendering for fewer), so 1-2 real reviews would mean either an awkward
// partial mix with invented ones or a broken layout — better to keep the
// existing all-invented behavior until there's enough real material.
// Deliberately still lets writeContent() run first rather than skipping the
// LLM call for testimonials — SECTION_HEADING and any other non-quote
// tokens the template needs still come from it.
function applyRealReviews(values, realReviews) {
  if (!Array.isArray(realReviews) || realReviews.length < 3) return values;
  const picked = realReviews.slice(0, 3);
  const overridden = { ...values };
  picked.forEach((review, i) => {
    const n = i + 1;
    overridden[`QUOTE_${n}_TEXT`] = review.text;
    overridden[`QUOTE_${n}_NAME`] = review.name;
    overridden[`QUOTE_${n}_ROLE`] = review.relativeTime ? `${review.relativeTime} · Google review` : 'Google review';
    if (review.avatarUrl) overridden[`QUOTE_${n}_AVATAR_URL`] = review.avatarUrl;
  });
  return overridden;
}

async function runCoder(apiKey, model, { section, config, goal, currentContent, manifestContext, wireframeId, isNewLayout, style, realReviews }) {
  const filePath = SECTION_FILES[section];
  const templateSource = loadTemplate(section, wireframeId);
  const contentTokens = extractTokens(templateSource).filter((t) => !isAssetToken(t) && t !== 'COPYRIGHT_YEAR');

  let values = await writeContent(apiKey, model, {
    section, config, contentTokens, goal, currentContent, manifestContext, wireframeId, isNewLayout, style,
  });
  if (section === 'testimonials') values = applyRealReviews(values, realReviews);

  const content = stamp(templateSource, section, values);
  return { section, path: filePath, content: stripCodeFences(content) };
}

module.exports = { runCoder };
