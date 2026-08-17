import { useState } from 'react';
import { Rocket, ExternalLink, Loader2 } from 'lucide-react';
import { useSandpack } from '@codesandbox/sandpack-react';
import { auth } from '@/lib/firebase';
import { saveRepoFiles, publishWebsite, type PublishResult } from '@/features/repositories/lib/repos.service';

// Lives inside the SandpackProvider tree, same pattern as SaveButton — needs
// the live file state to make sure Firestore actually has the latest edits
// before publishing. publishWebsite (functions/index.js) reads the `files`
// subcollection, not live Sandpack state, and RepoAutosave's 2.5s debounce
// could otherwise lose a click-right-after-typing race.
export default function PublishButton({
  repoId,
  productionUrl,
  showNotice,
  onPublished,
}: {
  repoId: string | null;
  productionUrl?: string;
  showNotice: (text: string) => void;
  onPublished: (url: string | undefined, status: PublishResult['status']) => void;
}) {
  const { sandpack } = useSandpack();
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async () => {
    if (!repoId) { showNotice('Nothing to publish yet'); return; }
    setPublishing(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) { showNotice('Sign in again to publish'); return; }

      await saveRepoFiles(repoId, sandpack.files);
      const result = await publishWebsite(repoId, idToken);

      onPublished(result.url, result.status);
      showNotice(
        result.status === 'READY' && result.url
          ? 'Published — your site is live'
          : 'Still building — check back in a moment'
      );
    } catch (err) {
      console.error('Publish failed:', err);
      showNotice(err instanceof Error ? err.message : 'Publish failed — try again');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {productionUrl && (
        <a
          href={productionUrl}
          target="_blank"
          rel="noreferrer"
          className="icon-button"
          aria-label="Visit live site"
          title={productionUrl}
        >
          <ExternalLink size={14} />
        </a>
      )}
      <button type="button" className="primary-button" onClick={handlePublish} disabled={publishing}>
        {publishing ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
        {publishing ? 'Publishing…' : 'Publish'}
      </button>
    </div>
  );
}
