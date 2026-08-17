# Empirial CRM (internal staff/call-agent portal)

## Status as of 15 August 2026 — re-verified against source, not the old draft

**This doc was previously badly stale and has been rewritten from a fresh
read of the actual code.** The old version described a separate,
never-deployed prototype living at `D:\empirialdesigns\CRM` on its own
Firebase project (`empirialcalls`). That is no longer true:

- The CRM has been **fully migrated into the main `empirialdesigns` repo and
  Firebase project.** Frontend lives at `src/staff/`, routed at `/staff/*`
  inside the main React Router app (`src/App.tsx`). Backend lives at
  `functions-staff/`, deployed as a second Cloud Functions codebase
  (`codebase: "staff"`) alongside the main site's `functions/`
  (`codebase: "default"`) — both declared in one `firebase.json`, both
  targeting the one project in `.firebaserc` (`"default": "empirialdesigns"`).
- The old `CRM/` directory is gone except for two empty leftover folders
  (`CRM/src/components`, 0 files) — safe to `rm -rf` whenever convenient, not
  a live second copy of anything anymore.
- **Every callable in `functions-staff/src/callable/` is live-deployed** —
  confirmed via `firebase functions:list` (`bulkAssignLeads`,
  `bulkDeleteLeads`, `bulkSetLeadStatus`, `changeUserRole`,
  `getTeamLeaderboard`, `importLeads`, `inviteUser`, `logCall`,
  `notifyOverdueFollowUps` (scheduled), `removeUser`, `seedDemoData`,
  `setDealPayment`, `toggleAgentStatus` all show up alongside the main
  site's own functions). `firestore.rules` deploys clean (`firebase deploy
  --only firestore:rules --dry-run` compiles successfully) and covers every
  collection this app uses.
- The three gaps the last review flagged as open are **all closed**:
  - `logCall()` now calls `writeAuditLog()` (`functions-staff/src/callable/
    logCall.ts:188`) — the audit trail no longer skips the highest-volume
    agent action.
  - The import pipeline works end-to-end: `admin.import.tsx` calls the real
    `importLeads()` callable (`src/staff/lib/functions.ts:129`, wired at
    `admin.import.tsx:249`), which does real phone/email dedup against
    existing leads and a real batch write with an audit entry
    (`functions-staff/src/callable/importLeads.ts`). Note the design
    changed from the original plan: there's no `imports`/`rows` job-doc
    schema and no Storage-trigger CSV parser — the client parses the file
    (`src/staff/lib/csv.ts`) and sends already-parsed rows directly to the
    callable, which is why there's no `imports` collection in
    `firestore.rules` and none is needed.
  - The staff login screen's demo/mock-login buttons
    (`src/staff/routes/login.tsx:279-301`) are gated behind
    `import.meta.env.DEV` and call `startMockStaffSession()`
    (`src/staff/lib/auth.ts`), which itself checks
    `import.meta.env.DEV && typeof window !== "undefined"` before doing
    anything — unreachable in a production build.
- What's genuinely still true from the old review, unresolved:
  - No `imports` job-doc/parser pipeline in the original "upload a file,
    watch a progress bar, review a job doc" sense — the simpler
    client-parses/server-dedups design above replaces it; decide if that's
    the accepted final design or still a gap worth closing.
  - `admin.settings.tsx`'s many sub-sections (Integrations, 2FA, Company
    Profile, Lead Rules) are still mostly UI stubs.
  - The AI Sales Assistant (`agent.assistant.tsx`) answers from a static
    keyword lookup (`src/staff/components/agent-assistant/
    canned-responses.ts`), not a real model call.
  - No SSR concerns anymore (see Stack below — this is a plain client SPA
    now, not TanStack Start SSR), which actually *removes* a category of
    risk the old doc spent a full section on.
  - Zero automated tests anywhere in the repo (shared with the rest of the
    codebase, not CRM-specific).

## Recent UI updates — 14 August 2026

- Rebranded the staff shell as **Empirial CRM** and updated the agent navigation to **Scripts & Lessons**.
- Added the **Empirial Sales Agent Academy**: five practical lessons, completion tracking, a final 80%-pass exam, and a printable certificate.
- Added admin course management on the Scripts page: add, edit, remove, and JSON-upload course lessons. Lessons are stored in `salesTrainingLessons` for live staff use and browser storage in demo mode. Firestore rules now allow staff reads and admin maintenance for this collection.
- Added realistic demo sales scripts and made mock-only script and follow-up reads avoid Firestore permission failures.
- Reworked the agent AI Assistant into a chat-first layout, with prompts and lead context in a compact support rail.
- Refined the follow-up calendar so all seven days fit within its card, with clearer selection and follow-up indicators.

## 1. What this is

The Empirial CRM is an internal staff tool for a sales/call-centre
operation — not a public marketing site. It has two portals: an
**Admin/Owner** portal for uploading and assigning business leads, managing
services and call scripts, tracking agent performance, and approving
commissions; and an **Agent** portal for calling assigned leads, logging
call outcomes, working follow-ups, browsing scripts/pricing, and querying a
(currently canned) AI sales assistant. It ships as part of the main
`empirialdesigns` app, mounted at `/staff/*`.

## 2. Stack

- **Framework:** Plain client-side React SPA (no SSR) — a second TanStack
  Router application (`src/staff/router.tsx`, `src/staff/routeTree.gen.ts`)
  grafted into the main React Router app via a single catch-all route
  (`<Route path="/staff/*" element={<StaffPortal />} />` in `src/App.tsx`).
  There is no TanStack Start, no Nitro/Cloudflare build target, no server
  functions — the SSR-migration concerns the previous version of this doc
  spent a whole section on do not apply; the app builds as static assets via
  the same `vite build` as the rest of the site.
- **Styling:** Tailwind, shadcn/ui components under `src/staff/components/
  ui/` (a separate copy from `src/components/ui/` — 46 vs 47 files,
  intentional isolation so the two Tailwind theme configs (`src/staff/
  staff-theme.css` vs the main site's) don't collide, at the cost of some
  duplication).
- **Data/forms:** `zod` + `react-hook-form` for forms; Firestore reads via
  the `firebase` JS SDK directly from route components/hooks (no
  React Query layer in this half of the app, unlike the builder's
  `repos.service.ts` pattern).
- **Backend:** Firebase — Auth (email/password + custom claims), Firestore,
  Cloud Functions (Node 20, `firebase-admin` v13 / `firebase-functions` v6,
  2nd-gen `onCall`/`onSchedule` except the 1st-gen-only `onUserCreate` auth
  trigger), deployed as the `staff` codebase in `firebase.json`.
- **Firebase project:** `empirialdesigns` — the same project the main site
  and builder use. `.firebaserc` has a single `"default"` entry; there is no
  separate CRM project anymore.
- React 19, TypeScript, Recharts for charts, `firebase` JS SDK v12.

## 3. Firestore schema

| Collection | Enforced in `firestore.rules`? | Fields (as written) | Notes |
|---|---|---|---|
| `meta/public` | Yes | `{ adminBootstrapped: boolean }` | Public read, Cloud-Functions-write-only. Drives the login page's "create admin" vs "sign in" split. |
| `staffUsers/{uid}` | Yes | `uid, email, displayName, role ("admin"\|"agent"), agentId, status ("active"\|"removed"), invitedBy, notificationPrefs, createdAt` | **Named `staffUsers`, not `users`,** specifically to avoid colliding with the main builder's own unrelated `users/{uid}` collection now that both live in one Firestore instance. Doc id = Auth uid. Own-doc read open to any signed-in user (avoids a claim-propagation race); no client writes — only `onUserCreate`/`inviteUser`/`changeUserRole`/`removeUser` write it. |
| `agents/{agentId}` | Yes | `uid, name, initials, email, phone, role, status ("Active"\|"Inactive"), joinedAt, monthlyTarget, targetDeals, commissionRateOverride, callsToday, callsThisWeek` | id === uid. No client writes; created by `inviteUser()`/`changeUserRole()`, status toggled only via `toggleAgentStatus()`. |
| `leads/{leadId}` | Yes | `business, contactPerson, role, phone, email, website, industry, location, address, serviceId, assignedAgentUid, status, value, source, lastContact, nextFollowUp, createdAt, createdBy, updatedAt, updatedBy, lostReason, deletedAt` | Row-level security: agent read/list scoped to `assignedAgentUid == request.auth.uid`; admin unrestricted. Agent update is field-restricted (status/lastContact/nextFollowUp/lostReason/updatedAt/updatedBy only). Hard delete is rules-denied; "delete" is a soft `deletedAt` stamp. |
| `leads/{id}/notes/{noteId}` | Yes | `author, authorUid, createdAt, body` | Client-writable (admin, or agent on their own lead); append-only. |
| `leads/{id}/activities/{activityId}` | Yes | `type, title, detail, actor, actorUid, at` | Cloud-Functions-only write — a trustworthy per-lead audit trail. |
| `deals/{dealId}` | Yes | `leadId, business, agentUid, serviceId, industry, value, commission, closedAt, paymentStatus` | Fully Cloud-Functions-owned (`allow write: if false`). Created only by `logCall()`; `paymentStatus` changed only by `setDealPayment()`. Commission is server-computed, never client-supplied. |
| `followUps/{followUpId}` | Yes | `leadId, agentUid, reason, previousNote, dueAt, status, overdueNotifiedAt?` | Created only by `logCall()`. Update restricted to `status`/`dueAt` on the owning agent's own doc, or admin. |
| `services/{serviceId}` | Yes | `name, short, description, price, promoPrice, commissionType, commissionValue, status, benefits[], pitch, objections[], icon, updatedBy, updatedAt` | Any signed-in read; admin-only write. |
| `scripts/{scriptId}` | Yes | `title, category, type, body, favouriteBy: uid[], updatedAt` | Admin write for the script itself; any signed-in user may update only their own `favouriteBy` membership. |
| `salesTrainingLessons/{lessonId}` | Yes | Lesson content for the Sales Agent Academy | Added 14 Aug 2026. Staff read, admin write. |
| `auditLog/{entryId}` | Yes | `actorUid, action, targetCollection, targetId, before, after, at` | Admin read-only; Cloud-Functions-only write via `writeAuditLog()`, now called by **every** mutating callable including `logCall()`. |
| `callLogs/{callLogId}` | Yes | `agentUid, leadId, at, outcome` | Lightweight per-call record so calls-per-day/per-agent aggregation doesn't need a collection-group query. Written only by `logCall()`. |
| `notifications/{notificationId}` | Yes | `recipientUid, title, detail, tone, read, at` | Written by `bulkAssignLeads()`, `logCall()`, `setDealPayment()`, and the scheduled `notifyOverdueFollowUps()`. Only the recipient may flip their own `read` field. |
| Deny-by-default catch-all | Yes | — | Anything not explicitly listed above is fully closed. |

`firestore.indexes.json` defines composite indexes for `notifications`
(`recipientUid` asc, `at` desc) and `callLogs` (`agentUid` asc, `at` asc).

## 4. Auth & roles

- **Method:** Firebase Auth, email/password only (no OAuth, no MFA).
- **Roles:** `admin` and `agent`, carried as a **custom claim**
  (`request.auth.token.role`) — every security rule and every Cloud
  Function's `requireAuth()`/`requireAdmin()`
  (`functions-staff/src/lib/authz.ts`) checks it with zero extra reads.
- **Bootstrap:** `onUserCreate` (`functions-staff/src/triggers/
  onUserCreate.ts`, a 1st-gen Auth trigger) runs a Firestore transaction
  against `meta/public.adminBootstrapped`. The first person ever to sign up
  becomes admin atomically; every signup after that is immediately disabled
  server-side — accounts after the first admin can only be created via the
  admin-only `inviteUser()` callable, which creates the Firebase Auth
  account directly and returns a one-time temp password (no email-sending
  infra exists).
- **Storage:** `staffUsers/{uid}` (identity/role) and `agents/{uid}`
  (operational sales data) are deliberately separate docs linked by
  `agentId === uid`.
- **Route gating:** two layout routes, `src/staff/routes/admin.tsx` and
  `agent.tsx`, each with a `beforeLoad` guard covering every nested
  `admin.*`/`agent.*` leaf route automatically (TanStack Router's
  file-based generator). Guard: resolve the current Firebase Auth user →
  redirect to `/staff/login` if none; fetch `staffUsers/{uid}` (retried a
  few times since `onUserCreate` provisions it asynchronously) → redirect
  if it never appears; compare role against the portal → redirect to the
  other portal's dashboard on mismatch.
- **Dev-only mock login:** `src/staff/routes/login.tsx` renders two
  "Demo admin"/"Demo agent" buttons only when `import.meta.env.DEV` is
  true, calling `startMockStaffSession()` which itself re-checks `DEV`
  before touching `sessionStorage`. Not reachable in a production build.

## 5. Cloud Functions inventory

All functions live under `functions-staff/src/`, re-exported from
`functions-staff/src/index.ts`, deployed as the `staff` Cloud Functions
codebase. **Confirmed live** via `firebase functions:list`.

**`lib/`** (shared helpers, not directly invocable)
- `admin.ts` — single `initializeApp()`; exports shared `db`/`auth`.
- `authz.ts` — `requireAuth()` / `requireAdmin()` guards.
- `audit.ts` — `writeAuditLog()`, now called by every mutating function.
- `notify.ts` — `writeNotification()` and `getAdminUids()`.

**`triggers/`**
- `onUserCreate` — first-signup-becomes-admin bootstrap; disables every later signup.

**`callable/`**
- `logCall()` — the centerpiece composite transaction. Validates the caller
  owns the lead (or is admin); updates the lead; optionally writes a note;
  always writes an activity and a `callLogs` record; optionally opens a
  `followUps` doc; optionally closes a `deals` doc with server-computed
  commission; notifies admins on a closed deal; **writes an audit log entry**.
- `bulkAssignLeads()`, `bulkSetLeadStatus()`, `bulkDeleteLeads()` — admin-only,
  batch (≤200 leads) writes with one `auditLog` entry each; delete is soft
  (`deletedAt`) only.
- `setDealPayment()` — admin-only. Sets a deal's `paymentStatus` to any of
  `Pending`/`Approved`/`Paid` with no transition-order validation. Audited;
  notifies the agent on Approved/Paid.
- `toggleAgentStatus()` — admin for any agent, or an agent for their own
  record; audited.
- `inviteUser()`, `changeUserRole()`, `removeUser()` — admin-only.
  `inviteUser()` creates a real Firebase Auth account + custom claim +
  `staffUsers`/`agents` docs and returns a one-time temp password.
  `removeUser()` disables the account and revokes the claim rather than
  hard-deleting.
- `seedDemoData()` — admin-only, one-shot. Loads seed data from
  `functions-staff/src/data/mock-seed.ts`. Refuses to run twice unless
  `{ force: true }`.
- `getTeamLeaderboard()` — any authenticated user. Server-side aggregation
  of the current month's deals by agent, sanitized ranking only.
- `importLeads()` — admin-only. Takes already-client-parsed rows, dedups
  against existing leads by phone/email, batch-writes valid rows with one
  audit entry. Wired end-to-end from `admin.import.tsx`.

**`scheduled/`**
- `notifyOverdueFollowUps()` — daily at 07:00. Scans open follow-ups,
  notifies the owning agent once per follow-up, capped at 200 per run.

## 6. Route/page inventory

File-based routes under `src/staff/routes/` (TanStack Router).

**Public**
| Route file | Path | Purpose |
|---|---|---|
| `index.tsx` | `/staff` | Landing/portal picker. |
| `login.tsx` | `/staff/login` | Single login route, two modes (create-admin vs sign-in) driven by a live read of `meta/public.adminBootstrapped`. |

**Layout guards**
| Route file | Path | Purpose |
|---|---|---|
| `admin.tsx` | `/staff/admin` | `beforeLoad` guard — requires signed-in + `role: "admin"`; nests all `admin.*` routes. |
| `agent.tsx` | `/staff/agent` | Same, for `role: "agent"`; nests all `agent.*` routes. |

**Admin portal**
| Route file | Path | Purpose |
|---|---|---|
| `admin.dashboard.tsx` | `/staff/admin/dashboard` | Executive overview — aggregates, quick actions, leaderboard, activity feed. (955 lines — a refactor candidate.) |
| `admin.leads.tsx` | `/staff/admin/leads` | Master unscoped lead database — search, filters, bulk assign/status/delete, import/export entry points. |
| `admin.agents.index.tsx` | `/staff/admin/agents` | Agent roster — add agent, toggle online/offline, reassign/deactivate. |
| `admin.agents.$id.tsx` | `/staff/admin/agents/:id` | Single agent profile — leads/commissions/performance tabs. |
| `admin.commissions.tsx` | `/staff/admin/commissions` | Commission tracking — approve/mark-paid deal payment lifecycle, payout export. |
| `admin.import.tsx` | `/staff/admin/import` | CSV/paste import wizard, wired to the real `importLeads()` callable. |
| `admin.pipeline.tsx` | `/staff/admin/pipeline` | Kanban-style sales pipeline by lead status. |
| `admin.reports.tsx` | `/staff/admin/reports` | Charts/analytics — calls per day, industry performance, lost reasons, revenue over time. |
| `admin.scripts.tsx` | `/staff/admin/scripts` | Manage call scripts/resources and Sales Academy lessons. |
| `admin.services.tsx` | `/staff/admin/services` | Manage services & pricing. |
| `admin.settings.tsx` | `/staff/admin/settings` | Company profile, Users & Roles, commission rules, lead rules, notification prefs, integrations, 2FA, audit log — mostly stub sections. |

**Agent portal**
| Route file | Path | Purpose |
|---|---|---|
| `agent.dashboard.tsx` | `/staff/agent/dashboard` | Personal scoped overview — own leads/deals/follow-ups, online/offline switch. |
| `agent.leads.index.tsx` | `/staff/agent/leads` | Own assigned leads — list, filter, "mark not interested." |
| `agent.leads.$id.tsx` | `/staff/agent/leads/:id` | Call Workspace — the richest page in the app, centered on the `logCall()` flow. |
| `agent.follow-ups.tsx` | `/staff/agent/follow-ups` | Own follow-ups — complete/reschedule. |
| `agent.scripts.tsx` | `/staff/agent/scripts` | Browse/favourite call scripts, Sales Agent Academy lessons. |
| `agent.services.tsx` | `/staff/agent/services` | Browse services/pricing, copy pitch. |
| `agent.performance.tsx` | `/staff/agent/performance` | Personal performance stats, leaderboard, achievements. |
| `agent.assistant.tsx` | `/staff/agent/assistant` | AI Sales Assistant chat (canned keyword matching, not a real LLM call). |

## 7. What's real vs. what's still UI-only

| Area | Status |
|---|---|
| Auth, roles, route guards | Real. Deployed. |
| Leads (CRUD, bulk ops, row-level security) | Real. Deployed. |
| Call logging (`logCall`), deals, commissions | Real. Deployed. Includes audit log. |
| Follow-ups + overdue notifications | Real. Deployed. |
| Notifications | Real. Deployed. Frontend bell wiring not independently re-verified this pass. |
| Lead import | Real, end-to-end, simpler design than originally planned (no job-doc/Storage-parser pipeline). |
| Sales Agent Academy / scripts | Real, Firestore-backed. |
| AI Sales Assistant | **Canned keyword matching**, not a model call. |
| Settings → Integrations, 2FA, Company Profile, Lead Rules | **UI stubs**, inert. |
| Reports rollups | On-demand aggregation (`getTeamLeaderboard()`), not precomputed rollup collections. |
| Document upload/download on lead workspace | Not built. |
| Automated tests | None, repo-wide. |

## 8. Known architectural notes

- **Two apps, one bundle.** `App.tsx` hands `/staff/*` to a second,
  independently-routed TanStack Router app with its own component library
  and theme file, all shipped in the same JS bundle as the marketing site
  and builder. Contributes to a large main chunk; route-level code-splitting
  for `/staff/*` is not done.
- **Duplicated shadcn primitives.** `src/components/ui/` and
  `src/staff/components/ui/` are separate, near-identical copies (47 vs 46
  files). Intentional isolation, real duplication cost.
- **`admin.dashboard.tsx` is 955 lines** — a refactor candidate, unchanged
  concern from the last review.
