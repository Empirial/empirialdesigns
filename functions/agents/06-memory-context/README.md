# Layer 6 — Memory and context management

See [`repoStatus.js`](./repoStatus.js) — `buildRepoStatusSnapshot()`, the
cached Publish/SEO/Growth status snapshot passed to Goal Setter as
`current_status` on every chat turn. `section_manifest`/`style`/`palette`
carry-forward still lives in `functions/index.js`'s `aiChat`/`createWebsite`
handlers.

## `businessProfile.js` — the persistent "what this business is" doc

Previously the roadmap gap this README flagged: Goal Setter re-inferred
business type/tone/facts fresh-ish from whatever was in the current
message, with nothing carried forward — a fact established on turn 1 had no
memory by turn 40. [`businessProfile.js`](./businessProfile.js) closes that:

- Stored as one field, `business_profile`, on the repo doc (`user_repos/{repoId}`)
  — same place/pattern as `section_manifest`/`style`/`palette`, no new
  Firestore collection.
- **Built once on create** (`buildInitialProfile`) from Goal Setter's own
  inference (`02-system-prompts/goalSetter.js`'s `business_type`/`audience`/
  `tone_keywords`/`key_facts` fields) — never invented here.
- **Merged forward on every edit** (`mergeProfileUpdates`), deterministically,
  not trusted to the model to return the whole object — the model only ever
  returns a small `profile_updates` partial, and only on a turn that
  genuinely changes something durable (a corrected business type, a new
  stable fact, an explicit tone/rebrand request), never on an ordinary copy
  edit. `keyFacts` is **append-only and deduplicated**: a fact from turn 3
  must survive a turn-40 edit that never mentions it.
- **Read by every Coder**, not just Goal Setter (`05-agent-loop/coders/
  runCoder.js`'s `businessProfileNote`) — `keyFacts` and `toneKeywords` get
  folded into every section's copywriter prompt, so a coder can't
  contradict a fact set weeks earlier, and a tone rebrand actually sticks
  instead of drifting back on the next unrelated edit.
- Goal Setter's prompt treats a request that conflicts with the locked
  profile (e.g. "make it playful" against a stored `tone_keywords: ["formal"]`)
  as an explicit profile update, not a one-off deviation — see its own
  "Business profile" section.

Deliberately does **not** duplicate `style`/`palette` — those are already
correctly locked/recolored by `pipeline.js` on the repo doc directly; this
file only owns what those two fields can't express.

See `../README.md`'s "6 — Memory and context management" section for the
full picture.
