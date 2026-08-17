// Agent 3: Manager. Pure orchestration, not an LLM call — see
// docs/MULTI_AGENT_ORCHESTRATION.md's "Manager" section. Decides execution
// grouping, assigns each dispatched section's wireframe (fresh random on
// create, reused from section_manifest on edit so an unrelated copy tweak
// doesn't silently reshuffle the layout), dispatches the coders, and merges
// their results + the new section_manifest.
const { CONTENT_SECTIONS, LINK_SECTIONS, ALL_SECTIONS, pickWireframeId, buildFileBlock } = require('./shared');
const { runCoder } = require('./coders/base');

const CODER_CONFIG = {
  nav: require('./coders/nav'),
  hero: require('./coders/hero'),
  about: require('./coders/about'),
  services: require('./coders/services'),
  testimonials: require('./coders/testimonials'),
  footer: require('./coders/footer'),
};

/**
 * @param {object} opts
 * @param {'create'|'edit'} opts.intent
 * @param {string} opts.apiKey
 * @param {string} opts.model
 * @param {{affectedSections: string[], sectionGoals: Record<string,string>}} opts.goalSetter
 * @param {Array<{id:string,summary:string,wireframe?:number}>} [opts.sectionManifest]
 * @param {string} [opts.style] - style pack id (see agents/shared.js STYLES);
 *   only consulted for a section getting a fresh wireframe (isNewLayout) —
 *   an edit reusing a prior wireframe ignores this entirely.
 * @param {Array<{name:string,rating:number,text:string,relativeTime:string,avatarUrl?:string}>} [opts.realReviews] -
 *   a business's real Google reviews (integrations/google/places.js), only
 *   ever consulted by the testimonials coder (see coders/base.js's
 *   applyRealReviews) — every other section ignores this entirely.
 * @param {(section: string) => Promise<string>} opts.getFileContent
 * @param {(chunk: string) => void} opts.onProgress
 */
async function dispatch({ intent, apiKey, model, goalSetter, sectionManifest, style, realReviews, getFileContent, onProgress }) {
  const files = [];
  const failedSections = [];
  const priorById = new Map((sectionManifest || []).map((m) => [m.id, m]));

  async function runOne(section, manifestContext) {
    try {
      const currentContent = await getFileContent(section);
      const priorEntry = priorById.get(section);
      // Fresh random wireframe for a section that's never existed (or a
      // fresh build); reuse the one already on record for an edit.
      const isNewLayout = intent === 'create' || !priorEntry || !priorEntry.wireframe;
      const wireframeId = isNewLayout ? pickWireframeId(style) : priorEntry.wireframe;
      const result = await runCoder(apiKey, model, {
        section,
        config: CODER_CONFIG[section],
        goal: goalSetter.sectionGoals[section],
        currentContent,
        manifestContext,
        wireframeId,
        isNewLayout,
        style,
        realReviews,
      });
      files.push({ ...result, wireframeId });
      onProgress(buildFileBlock(result.path, result.content));
    } catch (error) {
      failedSections.push(section);
      onProgress(`[Note: the ${section} update failed — ask me to retry it. (${error.message})]\n\n`);
    }
  }

  // Parallel content group: Hero/About/Services/Testimonials never need to
  // see each other's output, and never touch the same file, so running them
  // concurrently is safe. Each call's own try/catch (above) means one
  // failure doesn't take the others down with it.
  const parallelGroup = CONTENT_SECTIONS.filter((s) => goalSetter.affectedSections.includes(s));
  await Promise.all(parallelGroup.map((section) => runOne(section)));

  // Sequential link group: Nav and Footer actually need to know what
  // sections/headings exist to link to, so they run after the content group,
  // one after another, each given the same final manifest context.
  const sequentialGroup = LINK_SECTIONS.filter((s) => goalSetter.affectedSections.includes(s));
  const manifestContext = goalSetter.affectedSections.map((id) => ({
    id,
    summary: goalSetter.sectionGoals[id] || priorById.get(id)?.summary || '',
  }));
  for (const section of sequentialGroup) {
    await runOne(section, manifestContext);
  }

  // Merge the new manifest: untouched sections keep their prior entry,
  // successfully-changed sections get their goal text as a v1 approximation
  // of "what this section currently is" (not parsed from real headings),
  // plus whichever wireframe was assigned/reused for them.
  const changedById = new Map(files.map((f) => [f.section, f]));
  const newSectionManifest = ALL_SECTIONS
    .filter((id) => priorById.has(id) || changedById.has(id))
    .map((id) => {
      if (!changedById.has(id)) return priorById.get(id);
      const f = changedById.get(id);
      return { id, summary: goalSetter.sectionGoals[id], wireframe: f.wireframeId };
    });

  return {
    files: files.map(({ section, path, content }) => ({ section, path, content })),
    failedSections,
    newSectionManifest,
  };
}

module.exports = { dispatch };
