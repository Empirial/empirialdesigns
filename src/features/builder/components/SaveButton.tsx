import { Check } from 'lucide-react';
import { useSandpack } from '@codesandbox/sandpack-react';
import { auth } from '@/lib/firebase';
import { saveRepoFiles } from '@/features/repositories/lib/repos.service';

const FIREBASE_FUNCTION_URL = 'https://us-central1-empirialdesigns.cloudfunctions.net';

// Lives inside the SandpackProvider tree so it can read the live file state
// and force an immediate save, instead of waiting for RepoAutosave's debounce.
//
// Also requests an immediate GitHub push (requestRepoSync) instead of
// leaving this repo to wait for the 3-edit threshold or the 5-minute
// scheduled sweep — "Save" should mean pushed, not just cached in Firestore.
// The sync request isn't awaited: the Firestore write is the durable part
// and already succeeded by the time "Draft saved" shows, so a slow or
// failed sync doesn't hold up the button — it just catches up on the next
// scheduled sweep instead.
export default function SaveButton({ repoId, showNotice }: { repoId: string | null; showNotice: (text: string) => void }) {
  const { sandpack } = useSandpack();

  const handleSave = async () => {
    if (!repoId) { showNotice('Nothing to save yet'); return; }
    try {
      await saveRepoFiles(repoId, sandpack.files);
      showNotice('Draft saved');

      auth.currentUser?.getIdToken()
        .then((idToken) => {
          if (!idToken) return undefined;
          return fetch(`${FIREBASE_FUNCTION_URL}/requestRepoSync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
            body: JSON.stringify({ repoId }),
          });
        })
        .catch((syncError) => {
          console.error('requestRepoSync failed (will retry on the next scheduled sweep):', syncError);
        });

      // Refreshes the My Projects card thumbnail (see functions/preview.js)
      // against what was just saved. Not awaited — same reasoning as the
      // sync request above: the save itself already succeeded, and this can
      // take several seconds (headless-render a full page) that "Draft
      // saved" shouldn't sit and wait on.
      auth.currentUser?.getIdToken()
        .then((idToken) => {
          if (!idToken) return undefined;
          return fetch(`${FIREBASE_FUNCTION_URL}/regenerateRepoPreview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
            body: JSON.stringify({ repoId }),
          });
        })
        .catch((previewError) => {
          console.error('regenerateRepoPreview failed (thumbnail will stay stale until the next save):', previewError);
        });
    } catch (err) {
      console.error('Failed to save project:', err);
      showNotice('Could not save — try again');
    }
  };

  return (
    <button type="button" className="secondary-button" onClick={handleSave}>
      <Check size={14} /> Save
    </button>
  );
}
