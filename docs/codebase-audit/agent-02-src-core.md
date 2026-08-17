# Agent 02 — Core source

Status: structural pass complete; reference validation pending.

Scope contains 10 files: `App.tsx`, `main.tsx`, global CSS, `NotFound`, Firebase/util libraries, and shared hooks.

Findings:

- Keep: entry points, route registration, global styles, Firebase setup, and utilities unless import analysis proves otherwise.
- Investigate: duplicate toast hook locations (`src/hooks/use-toast.ts` and `src/components/ui/use-toast.ts`).
- Investigate: legacy route/component paths shown in git status; the worktree contains active renames and deletions that must not be treated as cleanup.
- No deletion performed.

