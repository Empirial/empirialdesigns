# Staff Portal (Empirial CRM) — MVP Review, 15 August 2026

Scope: `src/staff/*` (frontend, mounted at `/staff/*`), `functions-staff/*`
(backend, deployed as the `staff` Cloud Functions codebase), and the
relevant sections of `firestore.rules`/`firebase.json`. This supersedes the
staff-portal-relevant parts of `docs/MVP_REVIEW_2026-08-14.md` and the old
`docs/CRM_STAFF_PORTAL.md`, both of which described this as an undeployed
prototype on a separate Firebase project. That's no longer accurate — see
the rewritten `docs/CRM_STAFF_PORTAL.md` for the full architecture writeup;
this doc is the punch list.

## Bottom line

Further along than any existing doc credited it with. Auth, leads, call
logging, deals/commissions, follow-ups, notifications, and lead import are
all real, deployed, and rules-enforced — not mock data behind a nice UI.
The three items the last review flagged as the top staff-portal gaps
(`logCall()` missing from the audit trail, the demo-login bypass reachable
in prod, the import pipeline having no backend) are **all already fixed**.

What's left is a shorter, more honest list: a few UI-only surfaces that
still promise more than they do, zero test coverage, and some structural
cleanup (bundle size, one 955-line route file, a leftover empty `CRM/`
directory).

## Verified this pass

- `firebase functions:list` — every `functions-staff` callable/scheduled
  function is live on the `empirialdesigns` project.
- `firebase deploy --only firestore:rules --dry-run` — rules compile clean.
- `firestore.rules` has an explicit block for every collection the staff
  portal writes, including `staffUsers` (deliberately not `users`, to avoid
  colliding with the main builder's own `users/{uid}` collection now that
  both live in one Firestore instance).
- `functions-staff/src/callable/logCall.ts:188` calls `writeAuditLog()`.
- `src/staff/routes/admin.import.tsx:249` calls the real `importLeads()`
  callable (`functions-staff/src/callable/importLeads.ts`), which does real
  phone/email dedup and a real batch write — not `MOCK_ROWS`.
- `src/staff/routes/login.tsx:279` gates the demo-login buttons behind
  `import.meta.env.DEV`, and `startMockStaffSession()`
  (`src/staff/lib/auth.ts`) independently re-checks `DEV` before doing
  anything — not reachable in a production build.
- `CRM/` (the old duplicate ~100-file tree) is gone — only two empty
  directories remain (`CRM/src/components`, 0 files).

## Fixed — 15 August 2026 (same pass as this doc)

1. **`admin.settings.tsx`'s fake state, closed.** The "Audit log" table was
   showing three fabricated names/actions as if real (worse than a stub —
   actively misleading). Now wired to the real `auditLog` Firestore
   collection (`useAuditLog()`, `admin.settings.tsx`), joined against
   `staffUsers` for a display name. Company Profile, Lead Settings,
   Notifications, and the 2FA toggle no longer claim `toast.success
   ("Settings saved")` when nothing persists — they now say plainly that
   the section isn't wired up yet, matching how the Integrations cards
   were already honest about being "Coming soon."
2. ~~AI Sales Assistant is not AI.~~ Turned out already handled — the page
   header already carries a "Demo assistant · simulated responses" pill
   disclosing this. No change needed.
3. **Commission math now has real unit tests.** Extracted the inline
   percentage/fixed commission calculation out of `logCall.ts` into a pure
   `computeCommission()` (`functions-staff/src/lib/commission.ts`), added
   Vitest to `functions-staff`, and wrote 4 passing tests (percentage,
   fixed, zero-value, fractional-percentage). This is a start on test
   coverage, not the full emulator-based rules-testing effort — see
   "Still open" below.
4. **`/staff/*` is now code-split.** `StaffPortal` is `React.lazy()`-loaded
   from `App.tsx` behind a `<Suspense>`. Confirmed via a real
   `npm run build`: it now ships as its own ~104KB chunk (`StaffPortal-
   *.js`) instead of bloating the main bundle.
8. **Leftover empty `CRM/` directory deleted.**
10. ~~`setDealPayment()` has no transition-order validation.~~ Re-read the
    code and comments — this is a deliberate, documented design choice
    ("including admin overrides like reverting Approved back to Pending"),
    not an oversight. No change made.

## Fixed — second pass, same day

5. **`admin.dashboard.tsx` refactored: 955 → 222 lines.** Split into 4
   sibling files under `src/staff/routes/-admin-dashboard/` (the `-` prefix
   excludes them from TanStack Router's route-file scanning): `dialogs.tsx`
   (Add Lead / Add Agent / Assign Leads / temp-password dialogs, each now
   self-contained with its own state and Firestore/Cloud-Function calls),
   `charts.tsx` (the 3 Recharts panels), `panels.tsx` (the 5 list/table
   panels), and `use-dashboard-data.ts` (every data-fetching hook plus a new
   `useDashboardMetrics()` combining hook for the derived KPI/leaderboard/
   pipeline calculations). `admin.dashboard.tsx` itself is now a thin
   composition layer. Built via 4 parallel agents each producing one new
   file with zero shared-file edits (no merge conflicts), then reassembled
   and verified with a clean `tsc --noEmit` and a real `npm run build`.
6. **Document upload/download replaced with a Quote Creator**, per a scope
   change — decided a generic file-attachment feature was less useful than
   letting an agent actually build and send a quote. New callable
   `createQuote()` (`functions-staff/src/callable/quotes.ts`, deployed
   under the `staff` codebase) lets an agent pick services for their lead;
   it reads each service's real price server-side (same
   never-trust-the-client principle as commission math), writes one
   `quotes/{id}` doc, and logs a "Quote sent" lead activity, all in one
   transaction with an audit-log entry. New `firestore.rules` block for
   `quotes/` (agent reads their own, admin reads all, no client writes).
   "Sending" is honestly scoped to what this app can actually do — no
   email/WhatsApp infra exists — so the agent gets a plain-text summary
   copied to their clipboard to paste in manually, the same pattern the
   Services page already uses for "copy pitch." Replaces the old fake
   "Documents" tab (hardcoded `MOCK_DOCS`, a toast pretending to download a
   file) in the agent's Call Workspace with a real "Quote" tab.
1. **Real emulator-based Firestore rules tests, running.** Installed a
   local JRE (Firebase's emulator needs one), added an `emulators.firestore`
   block to `firebase.json`, and wrote `tests/firestore-rules.test.ts` (28
   tests, Vitest + `@firebase/rules-unit-testing`) covering the row-level
   security guarantees that matter most: an agent can never read or
   field-write another agent's lead; `deals`/`auditLog`/`quotes` are fully
   Cloud-Functions-owned with zero client write paths; a notification
   recipient can only flip their own `read` field; the AI builder's
   `user_repos` ownership rules; and the deny-by-default catch-all. Run via
   `npm run test:rules`. All 28 pass. This is a down payment on rules
   coverage (services/scripts/salesTrainingLessons/callLogs aren't covered
   yet), not the full suite, but it's real and running, not aspirational.

## Still open

7. **Notification bell** — confirmed genuinely real (queries the live
   `notifications` collection, not mock data). Nothing to fix.
9. **Import pipeline's simpler final design** — documented as the accepted
   final shape in the rewritten `docs/CRM_STAFF_PORTAL.md`. Treat as done.
- **Broader rules/test coverage** — services/scripts/salesTrainingLessons/
  callLogs rules aren't covered by `tests/firestore-rules.test.ts` yet; no
  client-side (RTL) tests exist at all. Real remaining work, not urgent.

## Suggested next step

All P1 items and the two follow-on asks (dashboard refactor, quote
creator) are done and verified (`tsc --noEmit`, `npm run build`,
`npm run test:rules`, and `functions-staff`'s own `npm test` all pass
clean). Nothing has been deployed or committed — say the word if you want
this committed, or `functions-staff`/`firestore.rules` deployed so
`createQuote()` and the new `quotes` rule actually go live.
