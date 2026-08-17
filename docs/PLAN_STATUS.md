# Plan status

`PLAN.md` (repo root) is retained as the historical Aura Build specification.
It describes the earlier dashboard, builder, chat, and Sandpack
implementation and should not be treated as a complete description of the
current application — most of what it describes has since been either
superseded or fully rebuilt. See `docs/AI_BUILDER_ENGINE.md` and
`docs/MULTI_AGENT_ORCHESTRATION.md` for what actually runs today.

Current state:

- The active dashboard is `src/features/platform/pages/Platform.tsx`,
  rendered at `/dashboard`. It's a real, live, Firestore-backed surface, not
  a mock.
- The active builder is `src/features/builder/pages/BuilderPage.tsx`,
  rendered at `/dashboard/chat` (fresh prompt), `/dashboard/editor/:repoId`,
  and `/dashboard/preview/:repoId` — dispatched by route inside
  `Platform.tsx`. It calls the real, deployed `createWebsite` and `aiChat`
  Cloud Functions.
- Public pages are under `src/features/marketing/`.
- Authentication is under `src/features/auth/`.
- Repository data access is under `src/features/repositories/` —
  `repos.service.ts` is the one typed Firestore/Cloud-Function data layer;
  nothing talks to Firestore directly from a page component anymore.
- The older builder/chat/generation pages that used to live in `src/pages/`
  (`Dashboard.tsx`, `Builder.tsx`, `ChatInterface.tsx`, `GenerateWebsite.tsx`,
  `template.tsx`) are **deleted**, along with `RepoManagement.tsx` and
  `Preview.tsx` (the other transition-era attempt at this same surface).
  There is no more "transition code" left in `src/pages/` — that directory
  no longer describes a distinct legacy layer.
- Firestore security rules, all 7 Cloud Functions, and Firebase Hosting are
  deployed to the live `empirialdesigns` project — not just present as
  source. GitHub repo creation and the DeepSeek-backed multi-agent pipeline
  are both verified working end-to-end.

Use [CODE_REVIEW.md](CODE_REVIEW.md) for the current remediation order —
the "decide whether the legacy generation flow will be migrated or archived"
question this file used to pose is resolved: it was archived (deleted), and
`BuilderPage.tsx` is confirmed as its replacement.
