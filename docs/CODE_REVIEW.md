# Empirial Designs code review

Audit date: 2026-08-08 (previous audit: 2026-08-04 — see "Resolved since the
last audit" below for what closed in between).

## Baseline

- Stack: Vite 5, React 19, TypeScript, Tailwind CSS, React Router, Firebase
  Auth/Firestore/Functions/Hosting.
- Production build: passes.
- TypeScript: passes (`npm run typecheck` — 0 errors).
- ESLint: 0 errors, 7 warnings (all `react-refresh/only-export-components`
  inside stock shadcn/ui primitive files — expected for that template, not
  worth touching).
- `npm audit`: 19 vulnerabilities in the root project (6 moderate, 11 high,
  2 critical), 10 in `functions/` (4 moderate, 5 high, 1 critical). Not yet
  triaged — `npm audit fix --force` pulls in breaking changes on both sides
  (functions: `firebase-admin` major bump), so this needs a deliberate pass,
  not a blind fix.
- Cloud Functions, Firestore rules, and Firebase Hosting are now actually
  **deployed** to the live `empirialdesigns` project, not just present as
  source — see `docs/AI_BUILDER_ENGINE.md`'s "Deployment state" section.

## Resolved since the last audit

Closing these out rather than describing them as open risk, since they no
longer are:

- **OpenRouter credential exposure** — moot. The pipeline no longer uses
  OpenRouter at all; it calls DeepSeek directly (`functions/agents/shared.js`).
  The old `OPENROUTER_API_KEY` is still sitting unused in `functions/.env` /
  `.env.example`, harmless but worth removing in a future pass.
- **`functions/index.js` trusted caller-supplied `owner`/`repo`** — fixed.
  Every function taking `owner`/`repo` (or `repoId`) from the client now
  resolves through `resolveOwnedRepo(uid, ...)` before touching GitHub or
  Firestore for that repo.
- **GitHub blob/commit/ref sequence had no response checks, assumed `main`
  existed** — fixed. `createWebsite` now creates repos with `auto_init: true`
  (so `main` genuinely exists before the ref update) and checks `.ok` on
  every blob/tree/commit/ref call, throwing with the real GitHub error
  instead of silently reporting success. (Found by testing the live deploy,
  not by reading the code — the old code looked plausible; it just didn't
  work. See `docs/AI_BUILDER_ENGINE.md` for the full failure mode.)
- **`src/lib/claude.ts` named for Claude but calls a DeepSeek/OpenRouter
  proxy** — the file is now confirmed fully dead (its only consumer,
  `LovableSidebar.tsx`, is itself never rendered), not just mislabeled.
  Candidate for deletion, not yet done.
- **No `firestore.rules` file** — fixed. `firestore.rules` +
  `firestore.indexes.json` exist and are deployed, scoped to per-user
  ownership on `users/`, `user_repos/`, and their `files`/`chat_messages`
  subcollections.
- **`RepoManagement.tsx`/`Preview.tsx` did authenticated Firestore/GitHub
  work directly in page components** — moot, both deleted. `repos.service.ts`
  is the one typed data layer now; `BuilderPage.tsx` is the one builder
  surface.
- **`useConversations.ts` in-memory mock despite the rest of the app using
  Firestore** — superseded; still exists but is no longer part of the live
  builder flow (chat state now persists through `repos.service.ts`'s
  `chat_messages` subcollection instead). Candidate for deletion, not
  verified dead yet.
- **86 ESLint errors / 15 warnings** — down to 0 errors / 7 warnings. Mostly
  resolved by deleting confirmed-dead legacy pages
  (`Dashboard.tsx`/`Builder.tsx`/`ChatInterface.tsx`/`GenerateWebsite.tsx`/
  `template.tsx`, plus `AiChatWidget.tsx`/`AppSidebar.tsx`/`DashboardSidebar.tsx`,
  all unreferenced) and typing the remaining `any` usage in live files
  (`Platform.tsx`, `Auth.tsx`, `claude.ts`, `useConversations.ts`).
- **`tailwind.config.ts` used `require()` in an ESM/TS project** — fixed,
  now a proper `import`.
- **`PricingSection.tsx\nimport`** — the literal broken path was deleted.
- **Large generated raster assets duplicated / oversized** — the 8 largest
  offenders (`empirial-*.png` under `src/assets/Brand ID/generated/`,
  1.3-1.9MB each, ~14MB total) are fixed: converted to WebP, 94-98% smaller.
  This wasn't just a nice-to-have — the original PNGs were large enough to
  reliably time out the Firebase Hosting upload step, blocking every deploy
  until this got fixed.

## Findings by area

### Application shell and routing

- `src/App.tsx` is now small and current (`/`, `/auth`, `/dashboard/*`, a
  handful of redirects) — the "mixes providers/routes/legacy imports"
  finding from the last audit no longer applies; that bloat was the deleted
  legacy pages' imports.
- `src/main.tsx` still owns the error boundary and bootstrapping in one
  file; the error screen still exposes the raw error string to users
  (unchanged from last audit, not yet addressed).
- The public marketing pages are still thin wrappers around one large
  `EmpirialSite` module (nav, footer, layout, sections, data, and multiple
  page implementations in one file). Unchanged from last audit.

### Platform and builder

- `Platform.tsx` is the live dashboard shell (project list, templates,
  settings) and also decides, by route, when to render `BuilderPage`
  instead of its own UI (`/dashboard/chat`, `/dashboard/editor/:id`,
  `/dashboard/preview/:id`). This routing-by-string-match inside a page
  component works but is easy to miss when reasoning about `App.tsx` alone
  — worth a comment or an actual nested route if this file grows further.
- `BuilderPage.tsx` now correctly calls the real `createWebsite`/`aiChat`
  Cloud Functions (previously — before this audit period — a client-only
  stub silently skipped both GitHub and AI generation on the initial
  prompt, which was the root cause of "nothing happens when I prompt for a
  website" reports). Verified end-to-end via direct API calls, not just
  read in source.
- `CodeWorkspace.tsx`'s Sandpack `@/` import alias resolution was broken —
  every generated file using `@/components/...` failed in the Sandpack
  preview with "Could not find module," because Sandpack's bundler doesn't
  resolve TypeScript project references the way `tsc --build`/Vite do, and
  the generated repos' real `tsconfig.json` is intentionally solution-style
  (paths live only in the referenced `tsconfig.app.json`). Fixed by
  overlaying a flattened `tsconfig.json` in the Sandpack-only file map
  (`patchTsconfigForSandpack` in `repos.service.ts`) — the real committed
  repo is untouched.
- The "Refresh preview" button was a no-op (`showNotice('Preview
  refreshed')` and nothing else). Fixed to actually call Sandpack's
  `useSandpackNavigation().refresh()`.

### Integrations and security

- Firebase auth guards are still repeated per-page rather than centralized
  (unchanged from last audit).
- Supabase integration files (`src/integrations/supabase/`) were present but
  unused — deleted.
- GitHub token (`GITHUB_TOKEN`, classic PAT) is scoped to `public_repo`
  only — deliberately excludes `delete_repo`, confirmed by testing (a
  DELETE attempt against a broken test repo correctly 403'd). This means
  test/broken repos created during development can't be cleaned up via this
  app's own credentials; they need manual deletion on GitHub.
- `generateRepoName`'s regex misfired on ordinary prompts containing "for"
  (an extremely common word — "a website **for a** bakery"), producing
  garbage single-letter repo names. Fixed — see `docs/AI_BUILDER_ENGINE.md`.
- Backend handlers (`functions/index.js`) still duplicate bearer-token
  validation, response handling, and GitHub request setup across
  `createWebsite`/`aiChat`/`getRepoTree`/etc. Not yet extracted to shared
  middleware — unchanged finding from last audit, lower priority now that
  the correctness/security gaps in that duplicated code are closed.

### Type safety and correctness

- No more explicit `any` in live code paths (see "Resolved" above).
- Several `useEffect` calls still intentionally omit dependencies with an
  `eslint-disable-next-line` (e.g. `BuilderPage.tsx`'s auth-state effect,
  `useConversations.ts`'s seed effect) — each is commented with why
  (run-once-per-identity semantics), not silently suppressed. Worth a
  second look if any of these hooks grow more responsibilities.
- `command.tsx`/`textarea.tsx` empty-interface findings from the last audit
  not yet re-verified.

### Maintainability and performance

- `src/index.css` is still both the global design system and the entire
  platform stylesheet. Unchanged from last audit.
- The production bundle still has a JS chunk over 1.7MB minified
  (`index-*.js`, ~515KB gzipped) — Vite's own build warning flags this
  every build. Route-level lazy loading / manual chunking not yet done.
- `src/assets/Brand ID/empirial-icon.png` is 1.37MB for what's used as a
  small icon/favicon-style image — didn't block the Hosting deploy the way
  the 8 hero/section images did (see "Resolved" above), but is the next
  obvious candidate for the same WebP treatment.
- `public/desktop.ini` and screenshot artifacts — not re-verified this
  audit; carried over from the last one.

## Recommended remediation order

1. Triage the `npm audit` findings on both root and `functions/` — at least
   the critical ones — and decide whether the breaking-change upgrades
   (`firebase-admin` major bump in `functions/`) are worth taking now.
2. Delete confirmed-dead code: `src/lib/claude.ts` + `LovableSidebar.tsx`
   (fully unreachable), verify `useConversations.ts`'s current status.
3. Compress `empirial-icon.png` the same way the other 8 brand images were.
4. Centralize Firebase auth guards and backend bearer-token/GitHub-request
   handling (both still duplicated per-callsite).
5. Address the still-open `src/main.tsx` raw-error-to-user exposure.
6. Code-split the >1.7MB main bundle chunk.
7. Add tests for auth redirects, project ownership, generation failure, and
   repository access — still not present, still the last audit's final
   recommendation too.
