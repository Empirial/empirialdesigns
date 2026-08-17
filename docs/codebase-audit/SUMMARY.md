# Codebase Audit Summary

Audit date: 2026-08-14

## Current result

The 12 workstreams completed a structural inventory and first reference pass. No files were deleted, moved, or overwritten. Existing working-tree changes were preserved.

The scan covered the root project, `src`, `CRM`, `functions`, `functions-staff`, public/Firebase files, and documentation while excluding `.env*` contents, dependency internals, and generated-cache internals.

## Main findings

1. `src/staff` and `CRM/src` are parallel CRM/staff frontends. They share routes, data modules, and UI patterns, but both have clear project/runtime boundaries. This is an architecture-consolidation decision, not a verified-unused deletion.
2. `functions-staff/src/index.ts` exports the staff callables and scheduled function. Its callable files are reachable and must be retained.
3. The main `src/App.tsx` actively mounts marketing routes, `/dashboard/*`, and `/staff/*`. The current staff routes are therefore reachable from the root frontend.
4. Legacy source files named in the existing review documents are already represented as user working-tree deletions/renames. They were not deleted again.
5. Root build-info files and generated directories are cleanup candidates, subject to checking Git tracking and project tooling.
6. Root contains both `bun.lock` and `package-lock.json`; package-manager ownership needs to be decided before removing either.
7. `public/desktop.ini` and an unlabelled public screenshot are possible incidental assets, but require deployment/reference confirmation.
8. Documentation contains historical and current architecture descriptions; deleting older documents could remove useful decision history.

## Validation

- Root `npm run build`: did not complete within the safe execution window; result inconclusive.
- `CRM npm run build`: failed while loading Vite because the local CRM Vite installation does not resolve `node_modules/vite/index.js` correctly.
- No cleanup validation can be considered green until the dependency/build setup is repaired or explicitly accepted.

## Recommended cleanup order

1. Decide whether the canonical CRM frontend is `src/staff` or `CRM/src`.
2. Repair or reinstall dependencies only with approval because that changes lockfiles/node_modules.
3. Confirm tracked/generated status for `dist`, `.firebase`, `.tanstack`, Playwright artifacts, and `*.tsbuildinfo`.
4. Confirm package-manager policy (`npm` versus Bun).
5. Remove only individually verified artifacts, then run both builds and lint.

## Reports

See `agent-01-root-config.md` through `agent-12-cross-project-references.md` for workstream-level findings.
