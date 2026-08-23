// Layer 6: the persistent "what this business actually is" doc — the gap
// ../README.md's layer 6 section (and agents/README.md's layer 6 note)
// flagged as still on the roadmap. Before this, Goal Setter re-inferred
// business type/tone/facts fresh-ish from whatever happened to be in the
// current message; nothing carried forward, so an edit 10 turns after
// create had no memory of what turn 1 established. Stored as one field
// (`business_profile`) on the repo doc, read/written by index.js's
// createWebsite/aiChat handlers exactly like section_manifest/style/palette
// already are — no new Firestore collection needed.
//
// Deliberately does NOT duplicate style/palette (already carried on the repo
// doc directly, already correctly locked/recolored by pipeline.js) — this
// only owns the context those two fields can't express: what the business
// actually is, who it's for, its tone, and stable facts copy must never
// contradict.

// Built once, from Goal Setter's own create-time inference (see
// 05-agent-loop/goalSetter.js's parsed business_type/audience/tone_keywords/
// key_facts) — never invented here, this just shapes whatever the model
// already returned into the stored doc.
function buildInitialProfile({ businessType, audience, toneKeywords, keyFacts }) {
  return {
    businessType: typeof businessType === 'string' && businessType.trim() ? businessType.trim() : null,
    audience: typeof audience === 'string' && audience.trim() ? audience.trim() : null,
    toneKeywords: Array.isArray(toneKeywords) ? toneKeywords.filter((t) => typeof t === 'string' && t.trim()).slice(0, 6) : [],
    keyFacts: Array.isArray(keyFacts) ? keyFacts.filter((f) => typeof f === 'string' && f.trim()).slice(0, 20) : [],
    lastUpdated: new Date().toISOString(),
    updatedBy: 'goalSetter',
  };
}

// Edit-turn merge — deterministic, not trusted to the model to return "the
// whole object" (the same reasoning as pipeline.js's palette/style
// lock-in): an edit only ever supplies `updates`, a small partial the model
// filled in when this turn's request actually changes something durable
// about the business (see goalSetter.js's system prompt). Anything the
// model leaves out of `updates` simply isn't touched here.
//   - businessType/audience: replaced only when a non-empty string is given
//     (a rare, explicit correction — "we're actually a cafe, not a bakery").
//   - toneKeywords: replaced only when a non-empty array is given (an
//     explicit tone/rebrand request) — never silently drifts from a single
//     copy-only edit.
//   - keyFacts: APPEND-only and deduplicated, never replaced — a stable
//     fact from turn 3 must survive a turn-40 edit that never mentions it;
//     losing one silently would mean a coder contradicting it weeks later
//     with no way to tell why.
function mergeProfileUpdates(existing, updates) {
  const base = existing && typeof existing === 'object'
    ? existing
    : { businessType: null, audience: null, toneKeywords: [], keyFacts: [] };

  if (!updates || typeof updates !== 'object') return base;

  const businessType = typeof updates.businessType === 'string' && updates.businessType.trim()
    ? updates.businessType.trim() : base.businessType;
  const audience = typeof updates.audience === 'string' && updates.audience.trim()
    ? updates.audience.trim() : base.audience;
  const toneKeywords = Array.isArray(updates.toneKeywords) && updates.toneKeywords.length > 0
    ? updates.toneKeywords.filter((t) => typeof t === 'string' && t.trim()).slice(0, 6)
    : (base.toneKeywords || []);

  const newFacts = Array.isArray(updates.keyFactsAdd)
    ? updates.keyFactsAdd.filter((f) => typeof f === 'string' && f.trim())
    : [];
  const keyFacts = [...(base.keyFacts || [])];
  for (const fact of newFacts) {
    if (!keyFacts.some((f) => f.toLowerCase() === fact.toLowerCase())) keyFacts.push(fact);
  }

  const changed = businessType !== base.businessType || audience !== base.audience
    || JSON.stringify(toneKeywords) !== JSON.stringify(base.toneKeywords || [])
    || keyFacts.length !== (base.keyFacts || []).length;

  return {
    businessType,
    audience,
    toneKeywords,
    keyFacts: keyFacts.slice(0, 20),
    lastUpdated: changed ? new Date().toISOString() : (base.lastUpdated || new Date().toISOString()),
    updatedBy: changed ? 'goalSetter' : (base.updatedBy || 'goalSetter'),
  };
}

module.exports = { buildInitialProfile, mergeProfileUpdates };
