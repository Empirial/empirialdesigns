// Multi-agent generation pipeline — see docs/MULTI_AGENT_ORCHESTRATION.md.
//
// Thin entry point only: Goal Setter -> Manager (which dispatches the
// Coders). Used to be Request Taker -> Goal Setter -> Manager (a separate
// agent just to normalize the raw message before Goal Setter re-read it) —
// merged into one call in goalSetter.js itself once it became clear the
// intermediate clean_request had no other consumer and the two were always
// called back-to-back for every turn. Cuts every edit from 3 model calls to
// 2, every fresh build from 8 to 7. Each remaining agent's own behavior/
// config lives under functions/agents/ — open that folder to tune one agent
// without touching the others:
//   agents/goalSetter.js          — normalizes the raw request AND decides
//                                    affected sections + goals, dependency
//                                    rules, contact-details rule, recolor
//   agents/manager.js             — orchestration + wireframe assignment
//   agents/coders/<section>.js    — one file per section: its 9 wireframes
//                                    (+ an extraInstructions string you can
//                                    fill in to tune just that coder)
//   agents/coders/base.js         — the executor shared by all 6 coders
//   agents/shared.js              — the one DeepSeek call + utilities
//
// Everything downstream of "here are the final <file> blocks" — the
// Firestore `files` subcollection, GitHub sync (requestRepoSync — the
// explicit-flush half of what docs/AI_BUILDER_ENGINE.md originally
// described; the onRepoFileWrite trigger + scheduled sweep half of that
// design was never actually built, a gap publishWebsite works around by
// always force-syncing before it deploys), ownership checks — is unchanged
// and lives in index.js. This module (and the agents/ folder behind it)
// only decides what those file blocks contain.

const goalSetter = require('./agents/goalSetter');
const manager = require('./agents/manager');
const { SECTION_FILES, CONTENT_SECTIONS, LINK_SECTIONS, ALL_SECTIONS, DEFAULT_PALETTE, buildIndexCssFile, buildFileBlock } = require('./agents/shared');

/**
 * Runs the full pipeline for one turn (a fresh build or one chat edit).
 *
 * @param {object} opts
 * @param {'create'|'edit'} opts.intent - caller-determined, not re-derived
 *   from the model (createWebsite always means create; aiChat only ever
 *   runs against an existing owned repo, so it always means edit).
 * @param {string} opts.rawInput - the user's prompt / latest chat message.
 * @param {string} opts.apiKey - DEEPSEEK_API_KEY.
 * @param {string} opts.model - shared model for every call (Goal Setter + up to 6 Coders).
 * @param {Array<{id:string,summary:string,wireframe?:number}>} [opts.sectionManifest] -
 *   the repo's current section_manifest field, if any (edit only).
 * @param {string} [opts.priorStyle] - the repo's current style pack id (see
 *   agents/shared.js STYLES), if any. A style is decided once, on create,
 *   and locked in from then on: an edit always carries this forward rather
 *   than letting goalSetter reassign it, so a site never silently reshuffles
 *   its whole visual language off an unrelated copy tweak. Ignored when
 *   intent is 'create' (goalSetter decides fresh in that case).
 * @param {{baseHue:number,accentHue:number,accentSaturation:number}} [opts.priorPalette] -
 *   the repo's current color palette, if any. Locked in exactly like
 *   priorStyle on every edit — UNLESS this edit is itself an explicit
 *   request to recolor the site, in which case Goal Setter's `recolor: true`
 *   overrides it with a freshly-inferred palette (see "Recolor" below).
 * @param {Array<{name:string,rating:number,text:string,relativeTime:string,avatarUrl?:string}>} [opts.realReviews] -
 *   a business's real Google reviews (integrations/google/places.js), if the
 *   caller has a linked place. Passed straight through to Manager; only the
 *   testimonials coder ever consults it, and only when there are >= 3 (see
 *   coders/base.js's applyRealReviews) — every other section ignores it.
 * @param {(section: string) => Promise<string>} opts.getFileContent - async
 *   lookup for a section's current file content; return 'none — new file'
 *   for a section that doesn't exist yet.
 * @param {(chunk: string) => void} [opts.onProgress] - called with plain
 *   text or `<file>` block chunks as they become available, in order.
 */
async function runPipeline({ intent, rawInput, apiKey, model, sectionManifest, priorStyle, priorPalette, realReviews, getFileContent, onProgress = () => {} }) {
  const goals = await goalSetter.run(apiKey, model, { intent, rawInput, sectionManifest });
  const style = intent === 'create' ? goals.style : (priorStyle || 'default');
  // Recolor: an edit Goal Setter identified as an explicit request to change
  // color/theme/branding (not merely any edit — see its own system prompt)
  // gets a freshly-inferred palette instead of the locked-in prior one, and
  // — since the pipeline otherwise only ever touches the 6 section files —
  // emits a real src/index.css file block below so the new palette actually
  // lands in the repo, not just in Firestore's `style`/`palette` bookkeeping.
  const recolor = intent === 'edit' && goals.recolor;
  const palette = intent === 'create' || recolor ? goals.palette : (priorPalette || DEFAULT_PALETTE);

  // A pure recolor ("make it more blue", nothing else) has no affected
  // sections and would otherwise hit the no-op/clarification path below —
  // recolor is real work even with zero section changes, so it must bypass
  // that early return.
  if (intent === 'edit' && goals.affectedSections.length === 0 && !recolor) {
    onProgress(goals.summary);
    return {
      summary: goals.summary,
      affectedSections: [],
      files: [],
      failedSections: [],
      newSectionManifest: sectionManifest || [],
      needsClarification: goals.summary,
      style,
      palette,
      recolored: false,
    };
  }

  onProgress(`${goals.summary}\n\n`);

  let files = [];
  let failedSections = [];
  let newSectionManifest = sectionManifest || [];

  if (goals.affectedSections.length > 0) {
    ({ files, failedSections, newSectionManifest } = await manager.dispatch({
      intent,
      apiKey,
      model,
      goalSetter: goals,
      sectionManifest,
      style,
      realReviews,
      getFileContent,
      onProgress,
    }));
  }

  if (recolor) {
    const cssContent = buildIndexCssFile(palette);
    files.push({ section: null, path: 'src/index.css', content: cssContent });
    onProgress(buildFileBlock('src/index.css', cssContent));
  }

  return {
    summary: goals.summary,
    affectedSections: goals.affectedSections,
    files,
    failedSections,
    newSectionManifest,
    style,
    palette,
    recolored: recolor,
  };
}

module.exports = {
  runPipeline,
  SECTION_FILES,
  CONTENT_SECTIONS,
  LINK_SECTIONS,
  ALL_SECTIONS,
};
