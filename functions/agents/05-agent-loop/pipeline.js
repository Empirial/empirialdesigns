// Multi-agent generation pipeline — see docs/MULTI_AGENT_ORCHESTRATION.md.
//
// Thin entry point only: Goal Setter -> Manager (which dispatches the
// Coders). Used to be Request Taker -> Goal Setter -> Manager (a separate
// agent just to normalize the raw message before Goal Setter re-read it) —
// merged into one call in goalSetter.js itself once it became clear the
// intermediate clean_request had no other consumer and the two were always
// called back-to-back for every turn. Cuts every edit from 3 model calls to
// 2, every fresh build from 8 to 7. functions/agents/ is organized by the
// 10 layers of an agent (see agents/README.md for the full map) — this file
// IS layer 5, the agent loop. Its own dependencies:
//   01-model/provider.js           — the one DeepSeek call + sampling profiles
//   02-system-prompts/goalSetter.js — Goal Setter's rules: dependency table,
//                                      affected_sections logic, contact-
//                                      details rule, recolor classification
//   02-system-prompts/coder.js      — the copywriter prompt shared by all 6 coders
//   04-tool-execution/templates.js  — loads + stamps the prebuilt wireframe templates
//   05-agent-loop/goalSetter.js     — this layer's call to Goal Setter
//   05-agent-loop/manager.js        — orchestration + wireframe assignment
//   05-agent-loop/coders/<section>.js — one file per section: its 9-12
//                                      wireframes (+ an extraInstructions
//                                      string you can fill in to tune just
//                                      that coder)
//   05-agent-loop/coders/runCoder.js — the executor shared by all 6 coders
//   ../shared.js                    — cross-layer constants + palette math
//
// Everything downstream of "here are the final <file> blocks" — the
// Firestore `files` subcollection, GitHub sync (requestRepoSync — the
// explicit-flush half of what docs/AI_BUILDER_ENGINE.md originally
// described; the onRepoFileWrite trigger + scheduled sweep half of that
// design was never actually built, a gap publishWebsite works around by
// always force-syncing before it deploys), ownership checks — is unchanged
// and lives in index.js. This module (and the agents/ folder behind it)
// only decides what those file blocks contain.

const goalSetter = require('./goalSetter');
const manager = require('./manager');
const { answerStatusQuery } = require('./statusAssistant');
const fileEditor = require('./fileEditor');
const { SECTION_FILES, CONTENT_SECTIONS, LINK_SECTIONS, ALL_SECTIONS, DEFAULT_PALETTE, buildIndexCssFile, buildFileBlock } = require('../shared');

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
 * @param {string} [opts.googlePlaceId] - the repo's linked Google Place id,
 *   if any. Passed straight through to Manager; only the footer coder ever
 *   consults it, to add a real map embed (see coders/runCoder.js).
 * runPipeline itself also reads goals.realAddress (a real street address the
 * user typed into this turn's message — see goalSetter.js) and passes it to
 * Manager the same way, as a fallback map-embed source for a business that
 * hasn't linked a Google Place yet.
 * @param {(section: string) => Promise<string>} opts.getFileContent - async
 *   lookup for a section's current file content; return 'none — new file'
 *   for a section that doesn't exist yet.
 * @param {() => Promise<string[]>} [opts.listProjectFiles] - lists every
 *   real file path currently in the project (not just the 6 sections) —
 *   only needed when Goal Setter classifies the turn as a file_fix (see
 *   fileEditor.js); undefined on 'create' (a fresh build has no existing
 *   tree to fix yet) is fine, that branch is simply never reached then.
 * @param {(path: string) => Promise<string>} [opts.getProjectFileContent] -
 *   one file's current content by arbitrary path (unlike getFileContent
 *   above, not limited to the 6 sections) — same file_fix-only condition.
 * @param {object} [opts.statusSnapshot] - the repo's cached Publish/SEO/
 *   Growth status (06-memory-context/repoStatus.js's buildRepoStatusSnapshot),
 *   if any. Only consulted when Goal Setter classifies the message as a
 *   status_query (edit only) — see statusAssistant.js. Ignored on 'create'.
 * @param {object} [opts.statusToolCtx] - execution context for the 3
 *   read-only status tools (04-tool-execution/statusTools.js's `ctx` shape:
 *   { repo, uid, db, repoId, getValidAccessToken }). Only used alongside
 *   statusSnapshot, same conditions.
 * @param {(chunk: string) => void} [opts.onProgress] - called with plain
 *   text or `<file>` block chunks as they become available, in order.
 */
async function runPipeline({ intent, rawInput, apiKey, model, sectionManifest, priorStyle, priorPalette, realReviews, googlePlaceId, getFileContent, listProjectFiles, getProjectFileContent, statusSnapshot, statusToolCtx, onProgress = () => {} }) {
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

  // A pure recolor ("make it more blue", nothing else) or a pure file_fix
  // (a bug report that names no section) has no affected sections and would
  // otherwise hit the no-op/clarification path below — both are real work
  // even with zero section changes, so they must bypass that early return.
  const fileFix = intent === 'edit' && goals.fileFix && listProjectFiles && getProjectFileContent;
  if (intent === 'edit' && goals.affectedSections.length === 0 && !recolor && !fileFix) {
    // Status query: real data, not a guess — Goal Setter's own `summary` is
    // deliberately just a holding line here ("Let me check that."), never
    // trusted as the actual answer (see its system prompt). Route to the
    // status assistant's small tool-calling loop instead, which answers
    // from the cached snapshot or a live read-only tool call.
    const summary = goals.statusQuery
      ? await answerStatusQuery(apiKey, model, { rawInput, statusSnapshot, ctx: statusToolCtx })
      : goals.summary;
    onProgress(summary);
    return {
      summary,
      affectedSections: [],
      files: [],
      failedSections: [],
      newSectionManifest: sectionManifest || [],
      needsClarification: goals.statusQuery ? null : summary,
      style,
      palette,
      recolored: false,
    };
  }

  onProgress(`${goals.summary}\n\n`);

  let files = [];
  let failedSections = [];
  let newSectionManifest = sectionManifest || [];
  let fileFixSummary = null;

  // Section Coders and the File Editor agent touch disjoint files (the File
  // Editor is barred from ever writing one of the 6 section paths — see
  // fileEditor.js's isOwnedBySectionCoder), so running them concurrently
  // rather than sequentially is safe and saves real wall-clock time on a
  // turn that needs both (e.g. "fix this crash AND update the hero text").
  const tasks = [];

  if (goals.affectedSections.length > 0) {
    tasks.push(
      manager.dispatch({
        intent,
        apiKey,
        model,
        goalSetter: goals,
        sectionManifest,
        style,
        realReviews,
        googlePlaceId,
        realAddress: goals.realAddress,
        getFileContent,
        onProgress,
      }).then((result) => {
        files.push(...result.files);
        failedSections = result.failedSections;
        newSectionManifest = result.newSectionManifest;
      })
    );
  }

  if (fileFix) {
    tasks.push(
      fileEditor.run(apiKey, model, {
        rawInput: goals.cleanRequest,
        listFiles: listProjectFiles,
        getFileContent: getProjectFileContent,
        sectionFilePaths: Object.values(SECTION_FILES),
      }).then((result) => {
        fileFixSummary = result.summary;
        for (const f of result.files) {
          files.push(f);
          onProgress(buildFileBlock(f.path, f.content));
        }
        onProgress(`${result.summary}\n\n`);
      }).catch((error) => {
        // Same reasoning as manager.js's runOne catch: log the real error,
        // never echo it into the chat reply itself.
        console.error('File Editor agent failed:', error);
        onProgress(`I tried to look into that but hit an error myself — go ahead and ask me to try again.\n\n`);
      })
    );
  }

  await Promise.all(tasks);

  if (recolor) {
    const cssContent = buildIndexCssFile(palette);
    files.push({ section: null, path: 'src/index.css', content: cssContent });
    onProgress(buildFileBlock('src/index.css', cssContent));
  }

  return {
    // fileFixSummary appended (not replacing goals.summary): goals.summary
    // already streamed first above and is what a section-only or recolor-
    // only turn's commit message/history entry has always used; a file_fix
    // turn adds its own after-the-fact summary (the File Editor only knows
    // what it actually did once it's done, unlike Goal Setter's up-front
    // one-liner) rather than overwriting it.
    summary: fileFixSummary ? `${goals.summary}\n\n${fileFixSummary}` : goals.summary,
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
