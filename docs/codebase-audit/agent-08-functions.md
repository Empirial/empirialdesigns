# Agent 08 — Main functions

Status: structural pass complete; reference validation pending.

Scope contains 71 non-secret files: function entry points, pipeline/document rendering, AI agents, coder modules, and 45 section templates.

Findings:

- Keep agent modules and templates until runtime/template-selection references are traced.
- Review all numbered templates for actual selection paths; similar names do not prove duplication.
- Exclude `functions/node_modules` and environment files from source cleanup.
- No deletion performed.

