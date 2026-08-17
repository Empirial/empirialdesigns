# Agent 07 — Separate CRM frontend

Status: structural pass complete; reference validation pending.

Scope contains 126 non-secret files, including its own Vite/TypeScript project, 26 routes, Firebase/auth/data libraries, UI primitives, and shared layout components.

Findings:

- `CRM` is a separate frontend project with its own package/configuration boundary.
- It substantially duplicates `src/staff`, including routes, libraries, and UI components; this is the main organization candidate.
- Do not delete either implementation until deployment ownership and route consumers are established.
- `CRM/AGENTS.md` requires preserving published Lovable history.
- No deletion performed.

