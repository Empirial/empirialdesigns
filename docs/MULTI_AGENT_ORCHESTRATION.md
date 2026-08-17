# Multi-agent generation pipeline

Status: **implemented and deployed.** All 7 Cloud Functions
(`createWebsite`, `aiChat`, `getRepoTree`, `getRepoContents`,
`onRepoFileWrite`, `scheduledRepoSync`, `requestRepoSync`) are live on
`empirialdesigns` (Node 20, `us-central1`) — this isn't just source anymore,
it's been exercised end-to-end (repo creation + chat edits, verified via
direct API calls and confirmed real content lands in both Firestore and the
generated GitHub repo). See the wireframe gallery for a visual reference of
the 54 default-pool templates: [wireframe-gallery.html](./wireframe-gallery.html)
(gallery not yet updated for the 18 style-pack templates below).

Sits **upstream** of
[AI_BUILDER_ENGINE.md](./AI_BUILDER_ENGINE.md) — nothing in that document
changes. This pipeline decides *what* `<file>` blocks get produced; the
Firestore `files` subcollection, `onRepoFileWrite`, `syncRepoToGitHub`,
`scheduledRepoSync`, `requestRepoSync`, and the ownership checks all consume
those blocks exactly as documented there, regardless of how those blocks got
built.

Code lives under `functions/agents/`:

```
functions/
  pipeline.js                    — thin entry point (Request Taker → Goal Setter → Manager)
  agents/
    shared.js                    — the one DeepSeek call + JSON/fence cleanup + the 6-section map
    requestTaker.js               — Agent 1
    goalSetter.js                 — Agent 2 (dependency rules, contact-details rule)
    manager.js                    — Agent 3: dispatch, wireframe + style assignment, manifest merge
    coders/
      base.js                    — the executor all 6 coders share (also owns per-style copy voice)
      templates/<section>/01.tsx..09.tsx  — the 54 default-pool wireframe templates (see below)
      templates/<section>/10.tsx,11.tsx,12.tsx — the 18 style-pack templates: apple/brutalist/minimalist
      nav.js / hero.js / about.js / services.js / testimonials.js / footer.js
                                  — per-section config: 9 default wireframe descriptions + 3 style
                                    descriptions (ids 10/11/12) + extraInstructions
```

## What changes and what doesn't

**Changes:** the inside of `createWebsite` (first generation) and `aiChat`
(follow-up edits) — previously each was one OpenRouter call that produced
every file at once, as raw generated code. That single call is replaced by
the pipeline below, and — a step beyond the original plan — the Coders no
longer generate code at all; see "Wireframe layout library."

**Does not change:** everything from "Step 8: Save to Firestore" onward in
`createWebsite`, all of `syncRepoToGitHub`/`onRepoFileWrite`/
`scheduledRepoSync`/`requestRepoSync`, `resolveOwnedRepo`, the `files`
subcollection shape, the sync-status fields, the GitHub commit mechanics.
Whatever the pipeline produces still lands as `<file path="...">...</file>`
blocks and gets batch-written to `user_repos/{id}/files/{path}` exactly as
before.

## The 9 agents

| Agent | Count | Job |
|---|---|---|
| Request Taker | 1 | Normalizes the raw user input into a clean, structured request |
| Goal Setter | 1 | Turns the request into per-section goals + decides `affected_sections` |
| Manager | 1 | Orchestration: assembles each coder's prompt, assigns wireframes, decides execution order/parallelism, dispatches, collects results |
| Coders | 6 | One per section: Nav, Hero, About, Services, Testimonials, Footer — each writes only its own section's *content*, never code |

### Request Taker (`agents/requestTaker.js`)

**Input:** raw chat message (or the initial build prompt), plus — for an
edit, not a fresh build — the current site's **section manifest** (see
below).
**Job:** resolve ambiguity, not generate anything. Strip filler, resolve
pronouns/references against current site state ("make it bolder" → "make
the [current topic] bolder"), preserve concrete details (names, numbers,
contact info) verbatim rather than summarizing them away — the Goal Setter
needs them intact.
**Output shape:**
```json
{
  "intent": "create" | "edit",
  "clean_request": "one clear sentence describing what's wanted",
  "mentioned_sections_guess": ["hero"]
}
```
**Implementation note:** `intent` is caller-supplied, not trusted from the
model — `createWebsite` always calls with `intent: 'create'`, `aiChat` only
ever runs against an existing owned repo so it always means `'edit'`.
Request Taker's own `intent` field is still requested (for a model that
reasons about it, the JSON shape stays self-describing) but ignored by the
caller. `mentioned_sections_guess` is similarly a rough first pass the Goal
Setter doesn't directly consume — it re-derives `affected_sections` itself
from `clean_request` plus the manifest.

### Goal Setter (`agents/goalSetter.js`)

**Input:** Request Taker's output + the section manifest + a small,
hardcoded **cross-section dependency table**.
**Job:** decide the real `affected_sections` list and write one concrete goal
per affected section.
**Output shape:**
```json
{
  "summary": "what's changing and why, one paragraph",
  "affected_sections": ["hero", "nav"],
  "section_goals": {
    "hero": "Change the headline to lead with the new pricing model...",
    "nav": "Update the CTA button label to match the new hero CTA..."
  }
}
```
**Deciding `affected_sections`:**
- `intent: "create"` → always all 6, enforced in code (not trusted to the
  model even if it returns something else).
- `intent: "edit"` → union of: (a) sections named or clearly implied in
  `clean_request`, (b) sections the dependency table flags as downstream of
  anything in (a).
- **Cross-section dependency table** (hand-written, embedded as instructions
  in the system prompt, not its own LLM call):
  | If this changes | Also flag |
  |---|---|
  | Hero headline/CTA | Nav (CTA button often mirrors hero's) |
  | Services list/offerings | Testimonials (only if it explicitly names an offering) |
  | Any section | Footer, only if the request explicitly mentions contact info, links, or copyright |
- If `affected_sections` would come back empty (genuinely can't tell), no
  coder calls happen — the pipeline returns `needsClarification` and the
  caller streams that back as a question instead of guessing.

**Contact details (added during build, not in the original spec):** if the
request or company info mentions real contact details (phone, email,
address, socials), the Goal Setter carries them through verbatim into the
footer's `section_goals` entry. If none exist anywhere, it invents
plausible, clearly-generic mock contact details instead — the footer coder
must always receive something concrete, never a bare placeholder string.

### Manager (`agents/manager.js`)

**Input:** Goal Setter's output.
**Job:** pure orchestration, not an LLM call. Splits `affected_sections`
into the parallel/sequential groups, **assigns each dispatched section's
wireframe** (see below), builds each coder's inputs, fires the calls,
collects results, and merges the new section manifest.

**Execution grouping:**
1. Any of Hero/About/Services/Testimonials in `affected_sections` run **in
   parallel** — they don't need to see each other's output, and each coder
   scope-locks to exactly one file, so there's no write race.
2. Nav and Footer, if affected, run **after, sequentially** — they're the
   two that need to know what sections currently exist to link to.

Each coder call is isolated with its own try/catch: a rejected call marks
that section as failed (surfaced via a `[Note: ... failed]` message in the
stream) without taking the others down — **partial success commits**, it
never rolls back the whole turn.

## Wireframe layout library — a step beyond the original plan

The original version of this document had Coders generate code from a text
description of a layout. In practice, that got replaced with something
better: **54 real, prebuilt React components** (9 layout variants × 6
sections) living at `functions/agents/coders/templates/<section>/01.tsx`
through `09.tsx`. A Coder's job shrank from *writing code* to *writing the
copy that fills in an already-correct template* — faster, cheaper, and
structurally guaranteed not to produce broken code, since the code itself
is never regenerated.

**How a template works:** each file is a complete, working component with
business content expressed as literal `{{TOKEN}}` placeholders (e.g.
`{{HEADLINE}}`, `{{CTA_TEXT}}`) instead of hardcoded text, built only on the
project's semantic Tailwind tokens (`bg-primary`, `text-muted-foreground`,
etc. — backed by real CSS variables in the generated site's `index.css`).
All 9 variants within a section reuse the same token vocabulary, so which
layout got picked doesn't change what content the coder needs to produce.

**Manager assigns the wireframe:**
- **Fresh build, no style (`default`):** a random number 1–9, independently
  per section.
- **Fresh build, named style:** every section is pinned to that style's one
  template (id 10 = apple, 11 = brutalist, 12 = minimalist —
  `agents/shared.js`'s `STYLE_WIREFRAME_ID`), so the whole site draws from
  one coherent visual language instead of 6 independently-rolled layouts.
- **Edit:** the section's existing wireframe (read from `section_manifest`)
  is *reused*, not rerolled — an unrelated copy tweak shouldn't silently
  redesign the layout. A section only gets a fresh pick (random or
  style-pinned) if it's never existed before.

## Style packs

A **style** is a site-wide visual language layered on top of the wireframe
system above, decided once by the Goal Setter on a `create` and then locked
in for the life of the project — an edit always carries the repo's existing
style forward (`pipeline.js`'s `priorStyle`/`style` resolution) rather than
letting a later, unrelated request silently reshuffle the whole site's look.
Valid ids live in `agents/shared.js`'s `STYLES`: `default` (the original
9-per-section random pool, no shared language), `apple` (translucent
surfaces, tight large-type tracking, press feedback — adapted from Apple's
*Designing Fluid Interfaces*/typography guidance; no spring/gesture JS, since
static marketing sections aren't drag surfaces and the generated repo has no
`motion`/`framer-motion` dependency to call), `brutalist` (raw, high-contrast,
thick borders, blunt uppercase type, hard offset shadows, no gradients or
blur), `minimalist` (quiet, generous whitespace, no shadows/gradients,
understated type).

Two things change per style, both in `agents/coders/`:
1. **Layout** — the section is pinned to its style's one template (see
   above). Each `<section>.js` config's `wireframes` array carries a 10th–12th
   description (indices 9–11, ids 10–12) alongside the original 9.
2. **Copy voice** — `coders/base.js`'s `STYLE_VOICE` map appends a short tone
   instruction to the copywriter's system prompt (e.g. brutalist: "blunt,
   declarative... no soft marketing adjectives") so the words filling in a
   style's layout don't clash with it. This applies on top of a style-agnostic
   typography/copy baseline (curly quotes, real ellipses, specific button
   labels, active voice) added to every coder call regardless of style,
   loosely adapted from Vercel's Web Interface Guidelines.

Extending a style to more layout variety, or adding a new style entirely,
means: add `<section>/1N.tsx` for all 6 sections, add its description to each
`<section>.js` `wireframes` array at the matching index, add its id to
`STYLE_WIREFRAME_ID`/`STYLES`, and (optionally) a `STYLE_VOICE` entry.

## Color palette

Also decided once by the Goal Setter on a `create` and locked in for the
project's life, same pattern as style (`pipeline.js`'s `priorPalette`/
`palette` resolution). Every generated site used to share one hardcoded
grayscale HSL set, hand-written once inside `index.js`'s `getShellFiles()` —
that's gone now. `getShellFiles(companyName, palette)` builds `src/index.css`'s
`:root` block from `agents/shared.js`'s `buildPaletteVars(palette)` instead.

The model's job is deliberately small and safe: it only ever picks two hues
(0–359) and a saturation (30–65) — `base_hue` (a faint neutral tint for
background/border/muted) and `accent_hue` (the actual brand/CTA color,
inferred from business type or explicit color language in the request) plus
`accent_saturation` (lower for calm/premium, higher for bold/vibrant). It
never touches raw HSL values for the 19 CSS variables directly. Every role's
*lightness* is a fixed constant inside `buildPaletteVars` — background/card/
popover always ~99%, foreground/card-foreground always ~9%, primary always
38% (dark enough for the white text on top of it, at any hue/saturation) —
so a bad hue choice can produce an ugly color, never unreadable text.
`destructive` is intentionally never themed; error red shouldn't shift with
the brand. `clampHue`/`clampSaturation` guarantee `goalSetter.run()`'s
`palette` result is always well-formed, even off a malformed model response,
so nothing downstream needs its own validity check.

A repo with no stored `palette` (pre-dating this feature, or an edit whose
`priorPalette` read failed) falls back to `DEFAULT_PALETTE` — hue 240,
saturation 6, a quiet neutral gray close to the old fixed look.

### Recolor — the one edit that touches the shell

Every other edit only ever produces the 6 section files. Recolor is the
single exception: when Goal Setter marks an edit `recolor: true` (an
explicit request to change color/theme/branding — "make it more blue",
"use a warmer palette" — never inferred from an ordinary content edit),
`pipeline.js`:
1. Uses Goal Setter's freshly-inferred palette instead of the locked-in
   `priorPalette`.
2. Emits a real `src/index.css` `<file>` block via `buildIndexCssFile()` —
   the same function `getShellFiles()` calls on create, so a recolored file
   is byte-for-byte what a fresh build would have produced.
3. Bypasses the "no affected sections → nothing to do" early return, since a
   pure recolor ("make it more blue", nothing else) has zero affected
   sections but is real work.

`index.js`'s `aiChat` persists the new `palette` back to Firestore whenever
`recolored` is true, even with zero affected sections — otherwise the new
color would only ever exist in that turn's stream. On the client, this needs
no special handling: `parseAiFileBlocks`/`sandpack.updateFile` are already
generic by path, so an `index.css` block is applied exactly like any section
file.

**A Coder's actual job now** (`agents/coders/base.js`, shared by all 6):
1. Load the assigned template file.
2. Scan it for exactly the `{{TOKENS}}` it contains (different per layout).
3. One LLM call asks *only* for those fields, as JSON — not code:
   ```json
   {"HEADLINE": "...", "SUBHEADING": "...", "CTA_TEXT": "..."}
   ```
4. Deterministic string-replace stamps the values into the template.

Two token categories are never sent to the LLM: anything ending in `_URL`
(image/avatar sources — filled with a placeholder image service URL, since
nothing here generates real images) and `COPYRIGHT_YEAR` (just
`new Date().getFullYear()`). Every unresolved token still gets replaced with
`''`, never left as literal `{{TOKEN}}` text — a token left inside a JSX
child position (as opposed to a quoted attribute) is invalid TypeScript once
compiled, so an unresolved token would break the generated site's build, not
just look wrong.

**Resolved:** color now varies per site too — see "Color palette" below.
Style-pack templates that use a literal arbitrary color (brutalist's yellow)
are the one exception: that accent isn't a themeable token, so it stays fixed
regardless of a site's palette.

## The section manifest

A short, cheap-to-read summary of the current site — not full file
contents — so Request Taker/Goal Setter/Nav/Footer don't need to load every
file to know what exists. Stored as the `section_manifest` field on the
`user_repos` doc itself (one small Firestore field, not a new
subcollection), regenerated by the Manager after every successful run:
```json
[
  { "id": "hero", "summary": "Bakery hero leading with the new seasonal menu", "wireframe": 2 },
  { "id": "nav", "summary": "Standard nav pointing at hero/services/contact", "wireframe": 7 }
]
```
`summary` is the Goal Setter's goal text for that section at the time it was
last (re)written — a v1 approximation of "what this section currently is,"
not parsed from the real rendered headings. `wireframe` is the number
Manager assigned/reused, which is what makes edit-time reuse possible.

A sibling top-level `style` field (not per-section — one value for the whole
repo doc, alongside `section_manifest`) persists the style pack chosen at
creation; see "Style packs" above.

## Cost/latency, concretely

Call *count* is unchanged from the original plan — what changed is that
each Coder call now asks for a small JSON object instead of a full file's
worth of code, so every one of these is cheaper and faster in practice than
the original estimate assumed:
- **Fresh build:** Request Taker (1) → Goal Setter (1) → 6 coders (parallel
  group of 4 + sequential group of 2) = **8 model calls total**.
- **Typical single-section edit:** Request Taker (1) → Goal Setter (1) → 1
  coder = **3 model calls**.
- **Edit that cascades (e.g. hero + nav):** 4 calls — Nav still runs after
  Hero, not in parallel with it.

## Resolved since the original draft

- **Model choice:** one shared model (`DEEPSEEK_MODEL`, default `deepseek-chat`)
  for all 9 calls — no separate cheap/fast model for Request Taker/Goal Setter
  in v1. Was `OPENROUTER_MODEL` via OpenRouter until this pipeline switched to
  calling DeepSeek directly — the free OpenRouter model's 50-requests/day
  account-wide cap (not per-user) made it unworkable beyond solo testing; one
  full-site rebuild alone is 8 calls. DeepSeek's API is OpenAI-compatible, so
  only `agents/shared.js`'s `callAgent()` needed to change.
- **Partial failure:** commit what succeeded, surface the rest as a retry
  prompt — implemented as described above.
- **Wireframe reroll on edit:** don't — reuse the section's existing
  wireframe unless it's never existed before.

## Open questions

- The cross-section dependency table starts as ~3 hardcoded rules — worth
  expanding once real usage shows what actually cascades in practice.
- Per-project color: resolved — see "Color palette" above. Open sub-question:
  should a chat edit be able to recolor an existing site? Today `palette` is
  locked at creation and an edit never re-touches `index.css`.
