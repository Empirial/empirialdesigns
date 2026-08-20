# Layer 10 — Evaluation and observability

Real gap: no eval suite (a fixed set of test prompts run against the
pipeline to catch a regression before it ships) and no structured
observability beyond scattered `console.error` calls (visible in Cloud
Functions logs, not aggregated — no per-run cost/latency/token tracking).
What this would need, when it gets built:
- A small fixed set of "create" prompts (one per business type currently
  inferred in `docs/`) and "edit" prompts (one per section, one recolor,
  one no-op/clarification case) run against the pipeline and diffed against
  expected `affected_sections`/`recolor`/file-count shape — catches a
  system-prompt regression before it ships, without needing a human to
  eyeball every change.
- Per-run structured logging (repoId, intent, model, tokens in/out, latency,
  which sections succeeded/failed) instead of the current ad hoc
  `console.error`-only failure logging — enough to answer "what does one
  edit actually cost" and "which section fails most often" without manually
  grepping Cloud Functions logs.
