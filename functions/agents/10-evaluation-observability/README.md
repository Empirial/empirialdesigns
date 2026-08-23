# Layer 10 — Evaluation and observability

## Eval suite — two tiers

[`fixtures.js`](./fixtures.js) (the fixed set of test cases) +
[`checks.js`](./checks.js) (the copy-tell pattern checks — the automatable
half of `docs/VIBE_CODED_REPORT.md`'s Section 3, matching what
`02-system-prompts/coder.js` instructs the model to avoid) +
[`run-eval.js`](./run-eval.js) (the runner, three modes below).

What it checks:
- **Goal Setter** (`agents/05-agent-loop/goalSetter.js`) — one "create" per
  business type its color-inference rules name explicitly (bakery, law
  firm, wellness studio), plus one "edit" per branch of its classification
  logic: a section-only edit, an explicit recolor, a no-op greeting, a
  status question, a build-error report. Each case asserts the parsed
  result's shape (`affectedSections`, `recolor`, `statusQuery`, `fileFix`,
  `palette.accentHue`) — catches a misclassification regression (e.g. a
  greeting starts editing a section again, or a status question stops being
  recognized) before it ships.
- **Coders** (`agents/05-agent-loop/coders/runCoder.js`) — one goal per
  section, run through the real coder + real wireframe template, checked
  against `checks.js`'s `BANNED_COPY_PATTERNS` (em/en dash, hollow filler
  taglines, buzzword stacking, decorative emoji, bare "Learn more"/"Click
  here" CTAs). A pass doesn't certify the copy is *good* — it prints the
  actual generated text either way, still worth a human skim — it only
  catches the specific, named regressions those prompt rules exist to
  prevent.

### `--mode=live` (default) — costs real money, run by hand

```
cd functions
npm run eval
```
Real DeepSeek calls against the real pipeline — the only tier that can catch
the *model* drifting (a prompt still parses fine but the model started
answering differently). Needs `DEEPSEEK_API_KEY` (reads `functions/.env` if
present) and network. Run it by hand after touching `goalSetter.js` or
`coder.js`, before shipping the change, or on a pre-release/weekly cadence —
not on every commit, that's what replay is for.

### `--mode=record` — refresh the replay fixtures

```
npm run eval:record
```
Identical real calls to live mode, but every call is also snapshotted to
[`recordings/<key>.json`](./recordings) (the key is a hash of exactly what
was sent — see `01-model/provider.js`'s `setEvalMode`, the seam this uses).
Run this by hand once after any prompt change to `goalSetter.js` or
`coder.js` that's meant to be kept — it both re-validates against real
DeepSeek and refreshes what the free tier below replays against. Commit the
changed files under `recordings/` alongside the prompt change.

### `--mode=replay` — free, no network, wired into CI

```
npm run eval:replay
```
Every `callAgent`/`callAgentWithTools` call is served from the committed
`recordings/` instead of hitting DeepSeek — no `DEEPSEEK_API_KEY` needed.
Catches a regression in *this codebase's* handling of a fixed model output
(`goalSetter.js`'s own JSON parsing, `shared.js`'s `extractJson`,
`checks.js`'s patterns) — it can never catch model drift, since it's
literally replaying yesterday's model response. Runs automatically on every
push/PR touching `functions/agents/**` via
[`.github/workflows/agent-eval-replay.yml`](../../../.github/workflows/agent-eval-replay.yml).

If replay fails with "No recording for this call" after a prompt edit,
that's expected — the hash changed because the prompt did. Run
`npm run eval:record` to refresh recordings for the new prompt, verify the
live results still look right, then commit the recordings alongside the
prompt change.

### Baseline diff

Every mode ends by diffing this run's per-case PASS/FAIL against
[`baseline.json`](./baseline.json) and printing what changed — e.g.
`goalSetter: edit — explicit recolor: was PASS, now FAIL` — instead of just a
flat count, so a regression is legible without re-reading raw output.
`live`/`record` overwrite `baseline.json` after a full run; `replay` never
does (it would otherwise let a stale recording quietly become "the new
normal").

Add a case to `fixtures.js` whenever a system-prompt change is meant to fix
a specific misclassification or copy tell — that's the regression this
suite exists to pin down. Keep the list small enough to read end to end;
it's a smoke test, not an exhaustive corpus.

## Still a gap: structured observability

No per-run structured logging (repoId, intent, model, tokens in/out,
latency, which sections succeeded/failed) — today's only signal is scattered
`console.error` calls, visible in Cloud Functions logs but not aggregated
anywhere. Not built: would need a small logging helper called from
`pipeline.js`/`manager.js` at the start and end of each agent call, writing
to a Firestore collection or a structured log line Cloud Logging can query
— enough to answer "what does one edit actually cost" and "which section
fails most often" without manually grepping logs.
