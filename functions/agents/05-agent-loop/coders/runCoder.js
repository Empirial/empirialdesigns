// Layer 5 (agent loop): the shared coder executor — the part of "being a
// coder" that's identical across all 6 sections. As of the template library
// under 04-tool-execution/templates/<section>/01.tsx..12.tsx, a coder no
// longer writes code: the wireframe IS real, prebuilt code already. A
// coder's job shrank to writing the business-specific COPY that fills it
// in — one small LLM call that returns JSON (e.g. {"HEADLINE": "...",
// "CTA_TEXT": "..."}), which then gets deterministically stamped into the
// template's {{TOKEN}} placeholders by 04-tool-execution/templates.js.
//
// This is NOT the file to open to change one section's behavior — go to
// ./`<section>.js` for that (extraInstructions), or edit/add a template
// under ../../04-tool-execution/templates/<section>/ directly. Only touch
// this file to change something true of every coder at once. To change the
// copywriter persona/prompt rules shared by every coder, go to
// ../../02-system-prompts/coder.js instead — this file only decides WHAT
// goes into that prompt's variables, not the prompt's own wording.
const { callAgent, SAMPLING_PROFILES } = require('../../01-model/provider');
const { extractJson, stripCodeFences, SECTION_FILES } = require('../../shared');
const { loadTemplate, extractTokens, isAssetToken, stamp, injectMapEmbed } = require('../../04-tool-execution/templates');
const { buildSystemPrompt } = require('../../02-system-prompts/coder');

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

  const system = buildSystemPrompt({ section, wireframeId, wireframeDescription, goal, editNote, manifestNote, extra, voice, contentTokens });

  const raw = await callAgent(apiKey, model, system, 'Write the content now.', SAMPLING_PROFILES.copy);
  const fallback = {};
  for (const t of contentTokens) fallback[t] = '';
  return extractJson(raw, fallback);
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

async function runCoder(apiKey, model, { section, config, goal, currentContent, manifestContext, wireframeId, isNewLayout, style, realReviews, googlePlaceId }) {
  const filePath = SECTION_FILES[section];
  const templateSource = loadTemplate(section, wireframeId);
  const contentTokens = extractTokens(templateSource).filter((t) => !isAssetToken(t) && t !== 'COPYRIGHT_YEAR');

  let values = await writeContent(apiKey, model, {
    section, config, contentTokens, goal, currentContent, manifestContext, wireframeId, isNewLayout, style,
  });
  if (section === 'testimonials') values = applyRealReviews(values, realReviews);

  let content = stamp(templateSource, section, values);
  // Map embed: footer-only, and only when a real Google Place is linked —
  // see 04-tool-execution/templates.js's injectMapEmbed for why this never
  // fires for the coder's own invented mock address.
  if (section === 'footer') content = injectMapEmbed(content, googlePlaceId);

  return { section, path: filePath, content: stripCodeFences(content) };
}

module.exports = { runCoder };
