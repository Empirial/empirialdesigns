import { useEffect } from 'react';
import { useSandpack } from '@codesandbox/sandpack-react';
import { saveRepoFiles } from '@/features/repositories/lib/repos.service';

// Debounced autosave of the live Sandpack file tree back to Firestore.
// Ported from the (now-retired) Preview.tsx's DebouncedSave — same 2.5s
// debounce, same target field (`user_repos/{id}.vfs`).
export default function RepoAutosave({ repoId }: { repoId: string }) {
  const { sandpack } = useSandpack();

  useEffect(() => {
    if (!sandpack.files || Object.keys(sandpack.files).length === 0) return;

    const timeout = setTimeout(() => {
      saveRepoFiles(repoId, sandpack.files).catch((err) => {
        console.error('Failed to auto-save project to Firestore:', err);
      });
    }, 2500);

    return () => clearTimeout(timeout);
  }, [sandpack.files, repoId]);

  return null;
}
