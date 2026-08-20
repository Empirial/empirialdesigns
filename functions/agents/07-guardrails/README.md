# Layer 7 — Limits and guardrails

Lives in `functions/index.js` (`checkRateLimit`/`RATE_LIMITS`, GitHub
retry caps, Cloud Function timeouts) — shared with ~30 unrelated Cloud
Functions in that file, not builder-exclusive. See `../README.md`'s
"7 — Limits and guardrails" section for exact line references.
