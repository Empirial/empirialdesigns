import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { createRepoFromGithubUrl } from '../lib/repos.service';

// Ported from RepoManagement.tsx's "Import GitHub Repository" dialog.
// Now pulls the repo's real file contents via the getRepoTree Cloud
// Function (see repos.service.ts's createRepoFromGithubUrl) instead of
// leaving the project on the starter template.
export default function ImportRepoDialog({ userId, onImported }: { userId?: string; onImported: () => void }) {
  const [open, setOpen] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!userId || !repoUrl.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error('You need to be signed in to import a repository.');
      await createRepoFromGithubUrl(userId, repoUrl.trim(), idToken);
      setOpen(false);
      setRepoUrl('');
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import repository');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* Matches .secondary-button (dashboard-theme.css) rather than the
            raw shadcn Button default — same height/radius/type as every
            other button along the Projects filter bar, instead of sitting
            visibly taller with a mismatched corner radius. */}
        <button type="button" className="secondary-button">
          <Plus className="h-3.5 w-3.5" /> Import repo
        </button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl border-white/10 bg-[#08080b] text-white shadow-[0_16px_60px_rgba(0,0,0,.55),0_4px_16px_rgba(99,102,241,.12)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import GitHub repository</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-4">
          <Label htmlFor="import-repo-url" className="text-white/70">Repository URL</Label>
          <Input
            id="import-repo-url"
            placeholder="https://github.com/username/repo"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className="h-11 rounded-xl border-white/10 bg-white/[0.03] text-white placeholder:text-white/25 focus-visible:ring-white/20"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
        <DialogFooter>
          <button type="button" className="secondary-button" onClick={() => setOpen(false)}>Cancel</button>
          <button type="button" className="primary-button" onClick={handleImport} disabled={loading || !repoUrl.trim() || !userId}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Import'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
