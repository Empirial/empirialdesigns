# Layer 8 — Error handling and retries

Split between `functions/index.js` (`githubJson`, `commitFilesToGithub` —
shared with non-builder Cloud Functions) and this agent pipeline itself
(`01-model/provider.js`'s `callAgent`, `../shared.js`'s `extractJson`
fallback, `05-agent-loop/manager.js`'s per-section failure isolation). See
`../README.md`'s "8 — Error handling and retries" section for exact
references.
