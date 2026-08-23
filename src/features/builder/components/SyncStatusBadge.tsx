import { AlertCircle, Check, CloudUpload } from 'lucide-react';
import type { Repo } from '@/features/repositories/lib/repos.service';

// The topbar affordance docs/AI_BUILDER_ENGINE.md's "Front-end changes"
// section called for and flagged as never built: a small read-out of
// github_sync_status/pending_edit_count so "did my edit actually reach
// GitHub" isn't a question you can only answer by reading Firestore
// yourself. BuilderPage keeps these two fields live via an onSnapshot
// listener on the repo doc, so this just renders whatever it's handed —
// no polling or fetching of its own.
//
// Hidden entirely for a repo with no repo_url (a not-yet-generated
// createRepoFromPrompt placeholder, or a document project) — there's
// nothing to sync to yet, so "synced"/"unsynced" isn't a meaningful state.
export default function SyncStatusBadge({ status, pendingCount }: { status?: Repo['github_sync_status']; pendingCount?: number }) {
  if (status === 'error') {
    return (
      <span className="sync-status-badge status-pill tone-error" title="The last GitHub sync attempt failed — it will retry automatically within a few minutes, or click Save to retry now.">
        <AlertCircle size={13} /> Sync failed
      </span>
    );
  }

  if (status === 'dirty') {
    const count = pendingCount && pendingCount > 0 ? pendingCount : null;
    return (
      <span className="sync-status-badge status-pill tone-warn" title="Saved to your account, not yet pushed to GitHub — this happens automatically within a few minutes, or click Save to push now.">
        <CloudUpload size={13} /> {count ? `${count} unsynced edit${count === 1 ? '' : 's'}` : 'Unsynced edits'}
      </span>
    );
  }

  // 'clean', or absent (a repo that predates these fields, or one that's
  // never had a Firestore-only edit outside the aiChat/publish paths that
  // already keep it clean) — same "nothing to push" state either way.
  return (
    <span className="sync-status-badge status-pill tone-neutral" title="Every saved edit has been pushed to GitHub.">
      <Check size={13} /> Synced to GitHub
    </span>
  );
}
