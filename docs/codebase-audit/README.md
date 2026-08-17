# Codebase Audit

This directory contains the 12 isolated workstream reports for the Empirial Designs repository.

## Audit rules

- Inspect source, configuration, documentation, and project assets.
- Do not read, copy, or report the contents of `.env` files or other secret-bearing files.
- Ignore dependency internals such as `node_modules` and generated caches during source review.
- Do not delete or move anything based only on a filename, age, or apparent duplication.
- A cleanup candidate must include evidence: references searched, relevant package/build usage, and risk.
- Existing working-tree changes belong to the user and must be preserved.

## Workstreams

| Report | Scope |
|---|---|
| `agent-01-root-config.md` | Root configuration, scripts, and package manifests |
| `agent-02-src-core.md` | Core `src` entry points, routing, hooks, and utilities |
| `agent-03-src-components.md` | Shared `src/components` and UI primitives |
| `agent-04-marketing.md` | Marketing features, pages, and assets |
| `agent-05-builder-platform-repositories.md` | Builder, platform, and repository features |
| `agent-06-staff-frontend.md` | Staff portal frontend |
| `agent-07-crm-frontend.md` | Separate `CRM` frontend |
| `agent-08-functions.md` | Main `functions` backend and AI agents |
| `agent-09-functions-staff.md` | `functions-staff` backend |
| `agent-10-docs.md` | Documentation and planning files |
| `agent-11-firebase-public-output.md` | Firebase, deployment, public assets, and generated output |
| `agent-12-cross-project-references.md` | Cross-project dependency, import, and reference audit |

Each report should classify findings as `keep`, `investigate`, or `verified-unused`, with the evidence supporting that classification.
