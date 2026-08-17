# Empirial Designs — MVP Review Report

**Date:** 2026-08-14
**Reviewer:** Claude Code (Automated Audit)
**Version Reviewed:** local snapshot, `main`, mid-restructure (uncommitted changes present)

---

## Executive Summary

This is one repository carrying three products: a public marketing site, an AI website-generator SaaS (sign up → describe a site → real GitHub repo → AI-generated code → live preview/edit), and an internal staff CRM being grafted in from a separate prototype. The AI builder's core loop is genuinely wired to live Cloud Functions and Firestore, not mocked, and the security rules are unusually careful for this stage. What holds it back from shippable: a login screen with a fake-login backdoor left in place, zero automated tests, a ~100-file duplicate of the CRM sitting alongside its ported copy, and a handful of real npm-reported vulnerabilities never triaged. Fix the auth screen and the duplication before anything else — everything else is real, incremental work.

**Overall MVP Score: 5.0 / 10**

---

## Product Overview

| Field | Value |
|---|---|
| Product Type | Three surfaces in one repo — marketing site, AI website-generator SaaS, internal staff CRM |
| Tech Stack | React 19 + Vite 5 + TypeScript + Tailwind + shadcn/ui; staff portal additionally runs TanStack Router grafted in at `/staff/*` |
| AI Integration | DeepSeek (`deepseek-chat`) via direct API call from Cloud Functions — drives repo code generation and in-app chat; the CRM's "AI sales assistant" is canned response text, not a model call |
| Auth | Firebase Auth, email/password, custom claims for staff roles |
| Database | Firestore — two logical schemas in one project (`user_repos/*` for the builder, `staffUsers/leads/deals/…` for the CRM) |
| Deployment | Live on Firebase Hosting + Cloud Functions (project `empirialdesigns`); no CI pipeline |

---

## Domain Scores

| Domain | Score | Rationale |
|---|---|---|
| Feature Completeness | 6/10 | The builder's core loop and marketing site work end-to-end; CRM import pipeline, audit trail, and AI assistant are stubbed or partial. |
| Code Quality | 5/10 | Feature-folder structure is sound, but `strict: false`/`noImplicitAny: false` and a full duplicate component tree undercut it. |
| Architecture | 5/10 | A real typed data layer (`repos.service.ts`) and route-by-prefix separation exist, but two independently-routed apps are bolted together in one bundle. |
| Security | 6/10 | Firestore rules and token verification are genuinely careful; undercut by a fake-login control, wide-open CORS, and unaddressed critical CVEs. |
| Test Coverage | 0/10 | No test files, no test runner installed, no CI — confirmed empty, not just low. |
| Developer Experience | 4/10 | `README.md` is unedited Lovable boilerplate; the real onboarding lives only in `CLAUDE.md`/`docs/`. |
| Production Readiness | 4/10 | Actually deployed and reachable, but no monitoring, a leaky error boundary, and a 1.86 MB unsplit main chunk. |
| **Weighted MVP Score** | **5.0/10** | Feature 30% · Code 15% · Architecture 15% · Security 20% · Tests 10% · DX 5% · Prod 5% |

---

## Feature Audit

### Fully Implemented

- ✅ **Public marketing site** — Home, Services, Portfolio, About, Contact — real content, no placeholders. `src/features/marketing/`
- ✅ **AI website builder, end-to-end** — Sign-in → prompt → real `createWebsite` Cloud Function → GitHub repo created via the GitHub API → files written to Firestore → Sandpack preview/edit → `aiChat` for iteration. Verified working, not just present as source (`functions/index.js:481-620`, `docs/AI_BUILDER_ENGINE.md`).
- ✅ **Typed Firestore data layer for projects** — `repos.service.ts` is the single path from UI to `user_repos/*` — no page component talks to Firestore directly anymore.
- ✅ **Bearer-token auth on every Cloud Function** — Every HTTP function verifies a Firebase ID token via `admin.auth().verifyIdToken()` before doing any work — `functions/index.js:484-493` and four more call sites.
- ✅ **Firestore security rules for both surfaces** — Ownership-scoped rules for the builder (`user_repos`) and role-scoped rules for the CRM (`leads`, `deals`, …), role sourced from a server-set custom claim, never a client field. Deny-by-default catch-all at the bottom. `firestore.rules`.
- ✅ **Staff CRM portal UI** — Admin and agent dashboards, lead pipeline, commissions, scripts, reports — a complete UI surface routed at `/staff/*`, per `docs/CRM_STAFF_PORTAL.md`.

### Partially Implemented (Mocked or Incomplete)

- ⚠️ **CRM import pipeline** — The `imports/{importId}` collection the architecture doc describes has no Firestore rule and no backing Cloud Function — it falls through to deny-by-default. UI exists (`admin.import.tsx`), backend doesn't.
- ⚠️ **CRM audit trail** — `writeAuditLog()` is called by every mutating callable except `logCall()` — an acknowledged gap in `docs/CRM_STAFF_PORTAL.md`, meaning the highest-volume agent action is the one that isn't logged.
- ⚠️ **"AI" sales assistant** — Agent-facing assistant answers from a static lookup table, not a model call. `src/staff/components/agent-assistant/canned-responses.ts`.
- ⚠️ **Error boundary** — Catches render errors, but shows the raw `error.toString()` to the end user instead of a recovery screen. `src/main.tsx:20-26`.

### Not Implemented (UI Only / TODO)

- ❌ **Real sign-in reliability** — The login screen ships a hardcoded `demo@empirial.com` bypass and two buttons — "Instant Mock Login," "Auto-fill Demo Credentials" — that only set a `localStorage` flag. See Security Findings, Critical. `src/features/auth/pages/Auth.tsx:38-93`.
- ❌ **Automated tests** — No `*.test.*`/`*.spec.*` file anywhere in the repository; no test runner in either `package.json`; no `.github/workflows`.
- ❌ **Single source of truth for the CRM** — A full second copy of the CRM (~100 files) still lives at `CRM/`, targeting its own separate Firebase project (`empirialcalls`). It is not code the app runs — `src/staff/` is the ported, running copy — but it is unremoved, untracked by git, and drifts from the copy that ships.

---

## Critical Issues (Ship Blockers)

1. **Login screen ships a fake-login control**
   - **Issue:** A hardcoded email (`demo@empirial.com`) and two buttons on the real sign-in screen bypass Firebase Auth entirely, setting `localStorage.empirial_mock_login` and toasting "Welcome back!" as if a session was established.
   - **Impact:** Firestore rules require a genuine `request.auth.uid`, so this doesn't grant real data access — but it does present a false success state on the one screen a new user's trust depends on most, and it's reachable in production, not gated behind a dev flag.
   - **File:** `src/features/auth/pages/Auth.tsx:38-46, 79-93, 219-229`
   - **Fix:** Delete the mock branch and both buttons, or gate them behind `import.meta.env.DEV` so they can never render in a production build.

2. **Zero automated tests protecting a real money/data path**
   - **Issue:** No unit, integration, or E2E tests exist for auth, project ownership, repo generation, or the CRM's commission math — all of which are exactly the flows where a silent regression is expensive.
   - **Impact:** Every future change to `repos.service.ts`, `firestore.rules`, or the Cloud Functions ships on faith. This has already been the last two internal audits' final recommendation and remains unaddressed.
   - **File:** Repo-wide — no test runner in either `package.json`.
   - **Fix:** Add Vitest + React Testing Library for the client, the Firebase emulator suite for rules/functions; start with auth redirects and repo-ownership rule coverage, the two areas a bug is worst.

3. **Two live copies of the CRM codebase**
   - **Issue:** `CRM/` (~100 files, its own Firebase project) and `src/staff/` (the ported, actually-served copy) are line-for-line identical apart from import-alias rewrites (verified by diff across every shared file).
   - **Impact:** Any staff-portal fix made in one tree silently doesn't exist in the other. Whoever finishes the migration has to remember which copy is real, and the repo carries ~100 dead files in the meantime.
   - **File:** `CRM/src/**` vs. `src/staff/**`
   - **Fix:** Once `src/staff/` is confirmed to be the shipping surface (it is — it's the one `App.tsx` routes to), delete `CRM/` outright rather than leaving it as a second source of truth.

---

## Security Findings

### Critical

- **Fake-login control reachable in production** — `src/features/auth/pages/Auth.tsx:38-46, 79-93`. Remove or dev-gate; see Ship Blocker 1 above — repeated here because it's a security-review finding first and a feature-completeness one second.

### High

- **Two critical, five high-severity npm advisories, unaddressed** — Root `package.json`, live re-run this pass: `11 vulnerabilities (4 moderate, 5 high, 2 critical)`, transitively via `protobufjs` and `websocket-driver`. `functions/` carries its own separate set per `docs/CODE_REVIEW.md` (not re-verified this pass). **Fix:** Run `npm audit fix` for the non-breaking fixes now; schedule a deliberate pass for whatever needs a major-version bump (flagged in `docs/CODE_REVIEW.md` as touching `firebase-admin`).

### Medium

- **Cloud Functions CORS reflects any origin** — `functions/index.js:3` — `cors({ origin: true })`, shared by every HTTP function. Every one of these functions already requires a bearer token, so this isn't an open door by itself — but it removes a layer of defense-in-depth for free. **Fix:** Lock `origin` to the known hosting domain(s).
- **No rate limiting on AI/GitHub-calling functions** — `createWebsite`, `aiChat` — each authenticated call triggers a DeepSeek request and GitHub API writes with no per-user throttle. A signed-in user (or a leaked token) can currently spend the app's DeepSeek/GitHub quota at will. **Fix:** Add a simple per-uid rate check before the expensive work starts.
- **Error boundary leaks raw error text** — `src/main.tsx:20-26`. **Fix:** Render a generic recovery message; log the real `error`/`errorInfo` to a monitoring service instead of the DOM.

### Low / Informational

- **Firebase web config hardcoded (expected, not a leak)** — `src/lib/firebase.ts:8-16`. No fix needed — Firebase client config is meant to be public; access control lives in `firestore.rules`, which is scoped correctly. Noted only so it isn't mistaken for a finding on a future pass.
- **GitHub PAT correctly scoped** — `functions/index.js` — `GITHUB_TOKEN` is a classic PAT scoped to `public_repo` only, confirmed by testing that a delete attempt 403's. No fix needed — flagging as a genuine strength; least-privilege was clearly a deliberate choice here.

---

## Architecture Notes

- **Strength — the builder's data layer.** `repos.service.ts` is a real seam: every read/write to `user_repos` goes through one typed module, and the Firestore rules were written against that exact shape (the rules file's own comments cite it). This is the kind of boundary that makes the rest of the app easy to reason about.
- **Strength — rules-first thinking on the CRM.** Row-level security (an agent only ever sees their own leads), server-only commission math, and append-only audit collections are enforced at the rules layer, not just assumed in the UI. That's the right layer to enforce them at.
- **Weakness — two apps sharing one bundle.** `App.tsx` hands off `/staff/*` to a second, independently-routed TanStack Router application (its own route tree, its own component library, its own Tailwind theme file) rendered inside the main React Router SPA. It works, but every dependency the staff portal needs — TanStack Router, Recharts, its full shadcn set — ships in the same bundle as the marketing site and the builder, which is a likely contributor to the 1.86 MB main chunk flagged below.
- **Weakness — duplicated UI primitives.** There are three parallel copies of the shadcn component set: `src/components/ui/`, `src/staff/components/ui/`, and `CRM/src/components/ui/`. A shared internal package (even an unpublished workspace package) would collapse this to one.

---

## Code Quality Highlights

- **Good:** `npm run build` and a full `tsc --noEmit` both pass clean right now — no compile errors, no stale type debt blocking the build. ESLint is reported at 0 errors in `docs/CODE_REVIEW.md`. The team's own `docs/CODE_REVIEW.md` and `docs/PLAN_STATUS.md` are unusually candid engineering logs — they name dead code, unresolved risk, and exactly which legacy files were superseded by what, which made this audit faster and more accurate than it would have been from source alone.
- **Concern:** `tsconfig.app.json` runs with `"strict": false`, `"noImplicitAny": false`, `"noUnusedLocals": false` — only `strictNullChecks` is on, and only because TanStack Router's generated types require it. This is a real gap between what TypeScript is configured to catch and what it's actually catching.
- **Concern:** `src/staff/routes/admin.dashboard.tsx` is 931 lines; `src/index.css` still serves as both the global design system and the entire platform stylesheet (unchanged since the last internal audit).

---

## MVP Completion Roadmap

### Remaining Work Items

| Task | Size | Hours | Priority |
|---|---|---|---|
| Remove fake-login control from `Auth.tsx` | XS | 2h | P1 |
| Delete `CRM/` once `src/staff/` parity is confirmed | S | 4h | P1 |
| `npm audit fix` pass + triage remaining breaking-change advisories | M | 8h | P1 |
| Lock Cloud Functions CORS to known origins; add per-uid rate limit on `createWebsite`/`aiChat` | M | 8h | P1 |
| Fix `main.tsx` error boundary to stop leaking raw errors; wire a monitoring hook (Sentry or similar) | S | 4h | P2 |
| Stand up a test runner (Vitest + RTL) and cover auth redirects + repo ownership rules | L | 20h | P2 |
| Add Firebase emulator-based rules tests for both schemas | L | 16h | P2 |
| Build the CRM import pipeline (`imports/` rules + Cloud Function) or remove the UI that promises it | L | 20h | P2 |
| Add `logCall()` to the audit-log write path | XS | 2h | P2 |
| Code-split the main bundle (route-level lazy loading for `/staff/*` and the builder) | M | 8h | P3 |
| Replace `README.md` with real setup docs; add a minimal CI workflow (typecheck + lint + build) | S | 4h | P3 |
| Consolidate the three UI-primitive trees into one shared source | L | 16h | P3 |

**Size key:** XS=2h, S=4h, M=8h (1d), L=16-24h (2-3d), XL=40h (5d)

### Timeline Estimates (solo developer, 6h/day)

| Scenario | Duration | Ships By |
|---|---|---|
| Optimistic | ~2.5 weeks | 2026-08-31 |
| Realistic | ~4 weeks | 2026-09-11 |
| Conservative | ~5.5 weeks | 2026-09-22 |

**What drives the timeline:**
- Raw task total is ~112h; ×1.4 integration/debugging buffer → ~157h; +20% QA (~31h) +2d deployment (~12h) +1d security hardening (~6h) → ~206h ≈ 34 six-hour days solo.
- Test infrastructure (36h combined) and the CRM import build-or-cut decision (20h) are the two items that can swing this by more than a week each — resolving "build it or remove the promise" for the import pipeline early is the single highest-leverage scoping call left.

### Recommended Sprint Plan

**Week 1 — Trust & Security (P1)**
- Remove the fake-login control
- Delete the duplicate `CRM/` tree
- `npm audit fix` + triage remaining advisories
- Lock down CORS, add rate limiting to the two AI/GitHub functions

**Week 2-3 — Test Coverage & Feature Closure (P2)**
- Vitest + RTL for auth and ownership flows
- Emulator-based rules tests for both Firestore schemas
- Fix the error boundary; wire basic error monitoring
- Decide and execute: build the CRM import pipeline, or remove its UI
- Add `logCall()` to the audit trail

**Week 4 — Polish & Deployment (P3)**
- Code-split the main bundle
- Real `README.md`, minimal CI workflow
- Begin consolidating the three UI-primitive trees

---

## Recommendations Summary

1. **[Most Critical]** Remove the fake-login control from the real sign-in screen — a two-hour fix that closes the single most trust-damaging thing in the codebase.
2. **[Second]** Pick one CRM tree and delete the other — `src/staff/` is what actually ships; `CRM/` is pure liability now.
3. Stand up tests before the next feature, not after — start with auth and ownership, the two places a silent regression is most expensive.
4. Triage the npm advisories — two critical, five high, sitting in a project that handles real user auth and payment-adjacent commission data.
5. Decide the CRM import pipeline's fate — either build the missing rules/function or remove the UI that implies it works.

---

## Conclusion

Not ready to ship as-is, but closer than the raw score suggests: the parts that are hardest to get right after the fact — Firestore rules, token verification, a typed data layer — are already done carefully. What's missing is mostly cleanup and discipline, not new invention. "MVP" here means one product path (sign up → generate a site → preview and edit it) that a stranger can trust end to end; that path already works mechanically, and is roughly three to five weeks of focused solo work from being trustworthy enough to hand to a real user.
