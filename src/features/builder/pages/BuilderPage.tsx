import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Check, ExternalLink, Loader2, Monitor, RefreshCw, Smartphone } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { isMockSession, mockUser } from '@/lib/mockAuth';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  appendChatMessages,
  createWebsiteFromPrompt,
  DEFAULT_FILES,
  generateDocumentFromPrompt,
  getChatHistory,
  getRepo,
  getRepoFiles,
  hydrateRepoFilesFromGithubIfEmpty,
  renameRepo,
  type ChatMessage,
  type Repo,
  type SandpackFiles,
} from '@/features/repositories/lib/repos.service';
import { SandpackProvider, useSandpackNavigation } from '@codesandbox/sandpack-react';
import BuilderTopbar from '../components/BuilderTopbar';
import AssistantPanel from '../components/AssistantPanel';
import PreviewWorkspace from '../components/PreviewWorkspace';
import CodeWorkspace from '../components/CodeWorkspace';
import LayersWorkspace from '../components/LayersWorkspace';
import RepoAutosave from '../components/RepoAutosave';
import SaveButton from '../components/SaveButton';
import PublishButton from '../components/PublishButton';
import ThemeButton from '../components/ThemeButton';
import WorkspaceTabs, { type WorkspaceView } from '../components/WorkspaceTabs';
import DocumentWorkspace from '../components/DocumentWorkspace';

// repoId is passed in by Platform.tsx when opening an existing project
// (/dashboard/editor/:repoId, /dashboard/preview/:repoId). When it's absent
// (arriving fresh from the home prompt bar, /dashboard/chat?prompt=...) this
// creates a brand-new project on mount instead — as a website by default, or
// as a document when Platform.tsx's mode picker sent ?mode=Document (see
// generateDocumentFromPrompt below). Once a project exists, its own
// repo.type is the source of truth for which builder renders (below), not
// this query param — it's only consulted for the not-yet-created case.
export default function BuilderPage({ repoId: repoIdProp }: { repoId?: string } = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const originalPrompt = new URLSearchParams(location.search).get('prompt') || '';
  const mode = new URLSearchParams(location.search).get('mode');

  const [repoId, setRepoId] = useState<string | null>(repoIdProp ?? null);
  const [repo, setRepo] = useState<Repo | null>(null);
  const [files, setFiles] = useState<SandpackFiles | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<WorkspaceView>('Preview');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [panelOpen, setPanelOpen] = useState(true);
  const [notice, setNotice] = useState('');

  const showNotice = (text: string) => { setNotice(text); window.setTimeout(() => setNotice(''), 2600); };

  // Firebase can invoke onAuthStateChanged's callback more than once for the
  // same signed-in session (and React StrictMode double-invokes effects in
  // dev), which would otherwise create two Firestore projects for one prompt.
  // This guard makes the "create a new project" branch run at most once per
  // mount, regardless of how many times the callback fires.
  const hasCreatedRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (rawUser) => {
      // See src/lib/mockAuth.ts — Instant Mock Login never produces a real
      // Firebase session, so fall back to the mock user rather than
      // bouncing straight back to /auth.
      const user = rawUser ?? (isMockSession() ? mockUser : null);
      if (!user) { navigate('/auth'); return; }

      try {
        if (repoIdProp) {
          // Opening an existing project. Fetching the repo doc and its
          // Firestore file cache in parallel is the common case (cache hit);
          // the GitHub fallback below only runs on the rare miss, so it
          // doesn't cost the fast path anything.
          const [loadedRepo, loadedFiles, loadedChatHistory] = await Promise.all([
            getRepo(repoIdProp),
            getRepoFiles(repoIdProp),
            getChatHistory(repoIdProp),
          ]);
          if (!loadedRepo) {
            setLoadError('That project could not be found.');
            return;
          }

          let filesToUse = loadedFiles;
          // getRepoFiles returns the DEFAULT_FILES constant itself (not a
          // copy) when the cache is empty, so this reference check is a
          // cheap way to detect "nothing saved yet" without a second read.
          if (filesToUse === DEFAULT_FILES && loadedRepo.repo_url) {
            const idToken = await user.getIdToken();
            const hydrated = await hydrateRepoFilesFromGithubIfEmpty(loadedRepo, idToken);
            if (hydrated) filesToUse = hydrated;
          }

          // Backfill for projects created before the founding prompt was
          // seeded into chat_messages directly (see the fresh-prompt branch
          // below) — generation_prompt has always been saved server-side
          // (functions/index.js Step 8), just never surfaced here. Best-effort
          // persist so this only has to happen once per project.
          let chatHistoryToUse = loadedChatHistory;
          if (chatHistoryToUse.length === 0 && loadedRepo.generation_prompt) {
            const seeded: ChatMessage = { role: 'user', content: loadedRepo.generation_prompt, seq: 0, created_at: new Date().toISOString() };
            chatHistoryToUse = [seeded];
            appendChatMessages(repoIdProp, [{ role: 'user', content: loadedRepo.generation_prompt, seq: 0 }]).catch((seedError) => {
              console.error('Failed to backfill founding prompt into chat history:', seedError);
            });
          }

          setRepo(loadedRepo);
          setRepoId(repoIdProp);
          setFiles(filesToUse);
          setChatHistory(chatHistoryToUse);
        } else {
          // Fresh prompt from the dashboard home screen — create the project
          // now via createWebsite: real GitHub repo, full AI generation,
          // committed and seeded into Firestore server-side. Can take a
          // while (see createWebsite's 300s timeout in functions/index.js),
          // which is why the loading screen below has its own copy for this
          // branch instead of reusing the "opening an existing project" one.
          if (hasCreatedRef.current) return;
          hasCreatedRef.current = true;

          const idToken = await user.getIdToken();
          const promptUsed = originalPrompt || (mode === 'Document' ? 'Untitled document' : 'Untitled project');
          const newRepoId = mode === 'Document'
            ? await generateDocumentFromPrompt(user.uid, idToken, promptUsed)
            : await createWebsiteFromPrompt(user.uid, idToken, promptUsed);
          const [newRepo, newFiles] = await Promise.all([getRepo(newRepoId), getRepoFiles(newRepoId)]);

          // Seed the real chat transcript with the founding prompt *before*
          // the navigate() below strips it out of the URL — this used to be
          // shown only by reading originalPrompt back out of location.search
          // at render time, which is exactly why it vanished the instant the
          // URL changed (not just on a later reload). Now it's just the
          // first message in the same transcript every later turn appends to.
          const seededHistory: ChatMessage[] = [{ role: 'user', content: promptUsed, seq: 0, created_at: new Date().toISOString() }];
          try {
            await appendChatMessages(newRepoId, [{ role: 'user', content: promptUsed, seq: 0 }]);
          } catch (seedError) {
            console.error('Failed to seed chat history with the founding prompt:', seedError);
          }

          setRepo(newRepo);
          setRepoId(newRepoId);
          setFiles(newFiles);
          setChatHistory(seededHistory);
          navigate(`/dashboard/editor/${newRepoId}`, { replace: true });
        }
      } catch (error) {
        console.error('Failed to load or create project:', error);
        // AI generation calls a real Cloud Function that verifies a genuine
        // Firebase ID token — a mock session (see src/lib/mockAuth.ts) can
        // get past the route guards but not past that check, so its token
        // always comes back rejected. Surface that as guidance instead of
        // the raw "Invalid token" the function actually returns.
        if (isMockSession()) {
          setLoadError('AI generation needs a real account — mock sessions are for browsing the dashboard and builder UI only. Sign up to build for real.');
        } else {
          // createWebsite's other errors are already curated (repo name
          // collision, missing server config, etc.) and safe to surface
          // directly; fall back to a generic message only for something unexpected.
          setLoadError(error instanceof Error ? error.message : 'Something went wrong loading this project.');
        }
        hasCreatedRef.current = false; // allow a retry (e.g. after a transient network error)
      }
    });
    return () => unsubscribe();
    // Only re-run when the *target* project identity changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoIdProp]);

  const handleRenameRepoName = async (name: string) => {
    if (!repoId) return;
    setRepo((prev) => (prev ? { ...prev, repo_name: name } : prev));
    try {
      await renameRepo(repoId, name);
    } catch (error) {
      console.error('Failed to rename project:', error);
      showNotice('Could not save the new name — try again');
    }
  };

  if (loadError) {
    return (
      <div className="chat-page-shell flex items-center justify-center">
        <div className="text-center text-white/60">
          <p>{loadError}</p>
          <button type="button" className="secondary-button mt-4" onClick={() => navigate('/dashboard')}>Back to dashboard</button>
        </div>
      </div>
    );
  }

  if (!files || !repoId) {
    return (
      <div className="chat-page-shell flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-white/50">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">
            {repoIdProp
              ? 'Loading your project…'
              : mode === 'Document'
                ? 'Writing your document…'
                : 'Building your website — this can take a minute or two…'}
          </span>
        </div>
      </div>
    );
  }

  // The document builder has no file tree, no Sandpack sandbox, and no
  // GitHub-backed AI chat — it's the structured content generateDocument
  // already saved to Firestore, rendered straight into DocumentWorkspace.
  // repo.type (not `mode`, which only matters before a project exists) is
  // the source of truth here so refreshing/reopening an existing document
  // project renders the same way it did on creation.
  if (repo?.type === 'document') {
    return (
      <div className="chat-page-shell">
        <div className="chat-workspace chat-workspace-nohead">
          <DocumentWorkspace repo={repo} navigate={navigate} showNotice={showNotice} />
        </div>
        {notice && <div className="toast-notice"><Check size={15} />{notice}</div>}
      </div>
    );
  }

  return (
    <div className="chat-page-shell">
      <div className="chat-workspace chat-workspace-nohead">
        <BuilderTopbar panelOpen={panelOpen} onOpenPanel={() => setPanelOpen(true)} />
        <SandpackProvider
          key={repoId}
          template="react-ts"
          theme="dark"
          files={files}
          // Real generated/imported projects live under /src (see
          // repos.service.ts's patchTsconfigForSandpack); only the starter
          // placeholder uses root-level paths. Hardcoding the starter's own
          // file list here used to hide every real project's actual
          // components from the Code/Files tabs entirely — no `visibleFiles`
          // restriction means Sandpack shows the real tree instead.
          options={{ activeFile: files['/src/App.tsx'] ? '/src/App.tsx' : '/App.tsx' }}
        >
          <RepoAutosave repoId={repoId} />
          {panelOpen && (
            <AssistantPanel
              projectName={repo?.repo_name || 'Untitled project'}
              onRenameCommit={handleRenameRepoName}
              onDashboard={() => navigate('/dashboard')}
              onSettings={() => navigate('/dashboard/settings')}
              panelOpen={panelOpen}
              onTogglePanel={() => setPanelOpen(false)}
              showNotice={showNotice}
              repoId={repoId}
              repoOwner={repo?.repo_owner}
              repoName={repo?.repo_name}
              initialHistory={chatHistory}
            />
          )}
          <div className="chat-preview-column chat-pill">
            <div className="chat-pill-head chat-pill-head-wrap">
              <WorkspaceTabs active={activeView} onChange={setActiveView} />
              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  className="icon-button"
                  aria-label={previewDevice === 'desktop' ? 'Switch to mobile preview width' : 'Switch to desktop preview width'}
                  aria-pressed={previewDevice === 'mobile'}
                  onClick={() => setPreviewDevice((prev) => (prev === 'desktop' ? 'mobile' : 'desktop'))}
                >
                  {previewDevice === 'desktop' ? <Monitor size={16} /> : <Smartphone size={16} />}
                </button>
                <RefreshPreviewButton onRefresh={() => showNotice('Preview refreshed')} />
                <button type="button" className="icon-button" aria-label="Open in new tab" onClick={() => showNotice('Opening in a new tab')}><ExternalLink size={15} /></button>
              </div>
              <div className="flex items-center gap-2">
                <SaveButton repoId={repoId} showNotice={showNotice} />
                <ThemeButton repoId={repoId} showNotice={showNotice} />
                <button type="button" className="secondary-button" onClick={() => navigate(`/dashboard/growth/${repoId}`)}>Growth</button>
                <button type="button" className="chat-share-button" onClick={() => showNotice('Share link copied')}><span className="avatar h-6 w-6 text-[10px]">E</span> Share</button>
                <button type="button" className="secondary-button" onClick={() => navigate('/dashboard/settings?tab=billing')}>Upgrade</button>
                <PublishButton
                  repoId={repoId}
                  productionUrl={repo?.vercel_production_url}
                  showNotice={showNotice}
                  onPublished={(url, status) => setRepo((prev) => prev
                    ? { ...prev, vercel_production_url: url ?? prev.vercel_production_url, vercel_deployment_status: status }
                    : prev)}
                />
              </div>
            </div>
            <div className="chat-pill-body">
              {/* Scoped boundary: malformed AI-generated code (e.g. invalid
                  JSX) can trip a bug in Sandpack's own error-reporting
                  internals — "Cannot assign to read only property 'message'"
                  — rather than just showing its usual in-preview error
                  overlay. Left uncontained that crash reaches main.tsx's
                  app-wide boundary and blanks the entire editor, chat
                  included. This keeps the blast radius to one workspace
                  view. Keying on activeView means switching tabs is itself a
                  retry — no separate reset click needed to get back to
                  Code/Files. */}
              <ErrorBoundary
                key={activeView}
                onError={(error) => console.error('Workspace view crashed:', error)}
                fallback={(error, reset) => (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-white/60">
                    <AlertTriangle className="h-6 w-6 text-amber-400" />
                    <p className="text-sm">This view hit an error rendering the current code.</p>
                    <p className="max-w-md text-xs text-white/35">{error.message}</p>
                    <button type="button" className="secondary-button" onClick={reset}>Try again</button>
                  </div>
                )}
              >
                {activeView === 'Preview' && <PreviewWorkspace device={previewDevice} />}
                {activeView === 'Files' && <CodeWorkspace readOnly />}
                {activeView === 'Code' && <CodeWorkspace />}
                {activeView === 'Layers' && <LayersWorkspace />}
              </ErrorBoundary>
            </div>
          </div>
        </SandpackProvider>
      </div>
      {notice && <div className="toast-notice"><Check size={15} />{notice}</div>}
    </div>
  );
}

// useSandpackNavigation() only resolves against the nearest SandpackProvider
// ancestor, so this has to be its own component rendered inside
// <SandpackProvider> — calling the hook directly in BuilderPage's own
// function body wouldn't see that context, since BuilderPage is the
// component that creates the provider, not one nested inside it. Previously
// this button just showed a "Preview refreshed" toast without actually
// refreshing anything.
function RefreshPreviewButton({ onRefresh }: { onRefresh: () => void }) {
  const { refresh } = useSandpackNavigation();
  return (
    <button
      type="button"
      className="icon-button"
      aria-label="Refresh preview"
      onClick={() => { refresh(); onRefresh(); }}
    >
      <RefreshCw size={16} />
    </button>
  );
}
