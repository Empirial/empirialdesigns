# Agent 09 — Staff functions

Status: structural pass complete; reference validation pending.

Scope contains 14 TypeScript files covering callable functions, user creation, scheduled follow-ups, mock seed data, and the functions index.

Findings:

- Keep all exported callables until frontend invocation and Firebase deployment configuration are traced.
- `mock-seed.ts` and `seed.ts` need explicit environment/authorization review before classifying them as unused.
- No deletion performed.

