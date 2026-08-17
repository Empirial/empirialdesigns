# Agent 06 — Staff frontend

Status: structural pass complete; reference validation pending.

Scope contains 109 files: TanStack router/routes, staff layout, CRM workflows, libraries, mock data, and duplicated UI primitives.

Findings:

- This is a substantial staff portal, not dead code by default.
- `routeTree.gen.ts` is generated-looking and must be checked against the router generation workflow before changing it.
- Mock/data modules may be production fallbacks or test fixtures; inspect imports and runtime branches.
- The staff UI collection overlaps heavily with `CRM/src/components/ui`; consolidation requires a migration plan.
- No deletion performed.

