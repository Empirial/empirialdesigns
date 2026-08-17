# Agent 12 — Cross-project references

Status: structural pass complete; detailed reference pass pending.

Scope contains 522 non-secret, non-dependency files across the repository.

Initial cross-project risks:

- `src/staff` and `CRM/src` contain near-parallel CRM implementations.
- `functions` and `functions-staff` are separate backend package boundaries and must not be merged casually.
- Root and CRM each have independent package/configuration files.
- Git status shows active renames/deletions and many untracked files; these are preserved as user work, not cleanup candidates.
- Next pass will trace imports, route registration, package scripts, Firebase exports, and documentation links.

