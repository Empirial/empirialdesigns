// Typed data layer for user_repos — the one real, Firestore-backed project
// model in the app. Ported out of RepoManagement.tsx and Preview.tsx (both
// unrouted and slated for removal once this is verified working) so page
// components stop talking to Firestore directly — see docs/CODE_REVIEW.md's
// "Platform and legacy application pages" finding.
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { starterTemplateFiles } from '@/features/builder/lib/starterTemplate';

const FIREBASE_FUNCTION_URL = 'https://us-central1-empirialdesigns.cloudfunctions.net';

// Firestore stores file paths without a leading slash (matches what
// functions/index.js's createWebsite/aiChat write); Sandpack's file map
// keys use a leading slash. Every read/write through this module crosses
// that boundary, so it's centralized here rather than repeated per call site.
function toRelativePath(path: string): string {
  return path.startsWith('/') ? path.slice(1) : path;
}
function toSandpackPath(path: string): string {
  return path.startsWith('/') ? path : '/' + path;
}

// A document's generated content — see functions/agents/documentBuilder.js,
// the single source of truth this is rendered from both for the builder's
// live preview (DocumentWorkspace) and, server-side, the downloadable PDF.
export interface DocumentContent {
  title: string;
  sections: { heading: string; body: string }[];
}

export interface Repo {
  id: string;
  user_id: string;
  // 'website' (the default — matches every repo created before this field
  // existed) has a real GitHub repo behind it and renders in Sandpack.
  // 'document' has no repo_owner/repo_url at all — see generateDocument in
  // functions/index.js — and renders via DocumentWorkspace instead.
  type: 'website' | 'document';
  repo_owner?: string;
  repo_name: string;
  repo_url?: string;
  deploy_url?: string;
  template_id?: string;
  template_type?: string;
  // The prompt createWebsite generated this project from (functions/index.js
  // Step 8) — used as a one-time fallback to seed chat_messages for projects
  // created before that seeding existed (see BuilderPage.tsx). Never shown
  // directly; always folded into the real transcript instead.
  generation_prompt?: string;
  document_content?: DocumentContent;
  asset_url?: string;
  // Real screenshot of the project's hero section (see functions/preview.js)
  // — set after the initial generation and refreshed on every manual save.
  // Absent until the first one lands, and best-effort forever after (a
  // render failure just leaves this stale rather than failing anything).
  preview_image_url?: string;
  preview_updated_at?: string;
  created_at: string;
  last_updated?: string;

  // Vercel publish state (functions/index.js's publishWebsite/getDeploymentStatus)
  // — see docs' Sprint 1. 'NOT_CONNECTED' until the first Publish click.
  vercel_deployment_status?: 'NOT_CONNECTED' | 'BUILDING' | 'READY' | 'ERROR';
  vercel_production_url?: string;
  vercel_project_id?: string;

  // SEO / Google Search Console state (functions/index.js's seoAudit/google*)
  // — see docs' Sprints 2-3.
  seo_status?: 'NOT_CONFIGURED' | 'GENERATED' | 'GOOGLE_CONNECTED' | 'VERIFICATION_PENDING' | 'VERIFIED' | 'SITEMAP_SUBMITTED';
  seo_audit?: { score: number; checks: Record<string, boolean> };
  google_search_console_property?: string;

  // Growth surface — PageSpeed, uptime, real reviews, Business Profile,
  // custom domain (functions/index.js's pageSpeedAudit/*Uptime*/*GooglePlace*/
  // businessProfile*/*Domain*). See features/platform/pages/Growth.tsx.
  pagespeed_audit?: { strategy: string; performance: number | null; accessibility: number | null; bestPractices: number | null; seo: number | null; fetchedAt: string };
  uptime_monitor_id?: string;
  uptime_status?: 'PAUSED' | 'PENDING' | 'UP' | 'SEEMS_DOWN' | 'DOWN';
  uptime_monitored_url?: string;
  google_place_id?: string;
  google_business_location_name?: string;
  custom_domain?: string;
  custom_domain_status?: 'PENDING' | 'MISCONFIGURED' | 'VERIFIED';
}

export type SandpackFiles = Record<string, { code: string }>;

// Canonical starting point for a brand-new project's file tree, until the
// first assistant response replaces it. Sandpack in BuilderPage runs the
// `react-ts` template, so this must stay in that same shape (TSX entry,
// not the old plain-JS shape Preview.tsx used) — see features/builder/lib/starterTemplate.ts.
export const DEFAULT_FILES: SandpackFiles = starterTemplateFiles;

function reposCollection() {
  return collection(db, 'user_repos');
}

function slugify(value: string, fallbackPrefix = 'project') {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return (slug || fallbackPrefix) + '-' + Math.floor(Math.random() * 10000);
}

function toRepo(id: string, data: Record<string, unknown>): Repo {
  return {
    id,
    user_id: data.user_id as string,
    type: data.type === 'document' ? 'document' : 'website',
    repo_owner: data.repo_owner as string | undefined,
    repo_name: data.repo_name as string,
    repo_url: data.repo_url as string | undefined,
    deploy_url: data.deploy_url as string | undefined,
    template_id: data.template_id as string | undefined,
    template_type: data.template_type as string | undefined,
    generation_prompt: data.generation_prompt as string | undefined,
    document_content: data.document_content as DocumentContent | undefined,
    asset_url: data.asset_url as string | undefined,
    created_at: data.created_at as string,
    last_updated: data.last_updated as string | undefined,
    vercel_deployment_status: data.vercel_deployment_status as Repo['vercel_deployment_status'],
    vercel_production_url: data.vercel_production_url as string | undefined,
    vercel_project_id: data.vercel_project_id as string | undefined,
    seo_status: data.seo_status as Repo['seo_status'],
    seo_audit: data.seo_audit as Repo['seo_audit'],
    google_search_console_property: data.google_search_console_property as string | undefined,
    pagespeed_audit: data.pagespeed_audit as Repo['pagespeed_audit'],
    uptime_monitor_id: data.uptime_monitor_id as string | undefined,
    uptime_status: data.uptime_status as Repo['uptime_status'],
    uptime_monitored_url: data.uptime_monitored_url as string | undefined,
    google_place_id: data.google_place_id as string | undefined,
    google_business_location_name: data.google_business_location_name as string | undefined,
    custom_domain: data.custom_domain as string | undefined,
    custom_domain_status: data.custom_domain_status as Repo['custom_domain_status'],
  };
}

/** List a user's projects, newest first. */
export async function listUserRepos(userId: string): Promise<Repo[]> {
  const q = query(reposCollection(), where('user_id', '==', userId), orderBy('created_at', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toRepo(d.id, d.data()));
}

/** Load one project's metadata. Returns null if it doesn't exist. */
export async function getRepo(repoId: string): Promise<Repo | null> {
  const snap = await getDoc(doc(db, 'user_repos', repoId));
  if (!snap.exists()) return null;
  return toRepo(snap.id, snap.data());
}

/**
 * Generated repos' real /tsconfig.json is intentionally solution-style
 * (`{ files: [], references: [...] }`, matching this very project's own
 * root tsconfig — see CLAUDE.md) with the actual "@/*" -> "./src/*" path
 * mapping living only in the referenced tsconfig.app.json. That's correct
 * for real tooling (tsc --build, vite.config.ts's own resolve.alias) but
 * Sandpack's in-browser bundler doesn't run Vite and doesn't resolve
 * project references — it only reads a flat `paths` field directly off the
 * root tsconfig.json it's given. Left as-is, every "@/..." import in a
 * generated site fails in the Sandpack preview with "Could not find
 * module", no matter what the importing/imported files actually contain.
 * This overlays a flattened root tsconfig.json *only in the Sandpack VFS*
 * (never written back to Firestore/GitHub) so Sandpack can resolve the
 * alias, without changing what real developers see if they clone the repo.
 */
function patchTsconfigForSandpack(files: SandpackFiles): SandpackFiles {
  const patched: SandpackFiles = {
    ...files,
    '/tsconfig.json': {
      code: JSON.stringify({
        compilerOptions: { baseUrl: '.', paths: { '@/*': ['./src/*'] } },
      }),
    },
  };

  // BuilderPage's SandpackProvider uses template="react-ts" — CodeSandbox's
  // CRA-emulation bundler, not a real Vite build. That template has its OWN
  // fixed entry chain hardcoded at the sandbox root: /index.tsx does
  // `import App from "./App"` and `import "./styles.css"`. A real generated
  // or GitHub-imported project is a real Vite app rooted under /src
  // (src/App.tsx, src/index.css) — those files are present in this file map
  // by the time this runs, but Sandpack never looks at them unless
  // something overrides its root-level /App.tsx and /styles.css to point
  // there. Left unpatched, every real project silently rendered Sandpack's
  // own placeholder ("Hello world") instead of the actual site — the real
  // files were sitting in the VFS the whole time, just never reachable from
  // the entry point Sandpack actually executes.
  if (patched['/src/App.tsx']) {
    patched['/App.tsx'] = { code: `export { default } from './src/App';\n` };
  }
  if (typeof patched['/src/index.css']?.code === 'string') {
    patched['/styles.css'] = { code: patched['/src/index.css'].code };
  }

  return patched;
}

/**
 * Load a project's saved file tree from the `files` subcollection — the same
 * store functions/index.js's createWebsite/aiChat write to — falling back to
 * the starter files for a brand-new project with nothing saved yet. One
 * Firestore read per file, not one big blob: see docs/AI_BUILDER_ENGINE.md
 * for why (Firestore's 1 MiB per-document cap).
 */
export async function getRepoFiles(repoId: string): Promise<SandpackFiles> {
  const snap = await getDocs(collection(db, 'user_repos', repoId, 'files'));
  if (snap.empty) return DEFAULT_FILES;

  const files: SandpackFiles = {};
  snap.docs.forEach((fileDoc) => {
    const data = fileDoc.data() as { path?: string; content?: string };
    if (!data.path || data.content === undefined) return;
    files[toSandpackPath(data.path)] = { code: data.content };
  });
  if (Object.keys(files).length === 0) return DEFAULT_FILES;
  return patchTsconfigForSandpack(files);
}

/**
 * Persist the current Sandpack file tree — one doc per path under
 * `files/{path}`, not a single field. Cloud Functions watch this
 * subcollection (onRepoFileWrite) and batch these writes into a real GitHub
 * commit on their own cadence; nothing in this function talks to GitHub.
 */
export async function saveRepoFiles(repoId: string, files: SandpackFiles): Promise<void> {
  const nowIso = new Date().toISOString();
  const repoRef = doc(db, 'user_repos', repoId);
  const batch = writeBatch(db);

  Object.entries(files).forEach(([path, file]) => {
    const relativePath = toRelativePath(path);
    const fileRef = doc(collection(repoRef, 'files'), encodeURIComponent(relativePath));
    batch.set(fileRef, { path: relativePath, content: file.code, updated_at: nowIso });
  });
  batch.update(repoRef, { last_updated: nowIso });

  await batch.commit();
}

/** Rename a project's display name. */
export async function renameRepo(repoId: string, name: string): Promise<void> {
  await updateDoc(doc(db, 'user_repos', repoId), { repo_name: name });
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  seq: number;
  created_at: string;
}

/**
 * Load a project's saved chat transcript, oldest first — the same
 * `chat_messages` subcollection appendChatMessages below writes to. `seq` is
 * a caller-assigned monotonic index (not Firestore doc order) so history
 * survives even though a turn's user+assistant docs land in the same batch
 * and can otherwise tie on create time.
 */
export async function getChatHistory(repoId: string): Promise<ChatMessage[]> {
  const q = query(collection(db, 'user_repos', repoId, 'chat_messages'), orderBy('seq', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as ChatMessage);
}

/**
 * Persist one turn's worth of messages (typically a [user, assistant] pair —
 * see AssistantPanel's send()) as one doc per message under `chat_messages`.
 * Callers assign `seq` themselves (continuing from the loaded history's
 * length) rather than this function reading current count, so a chat send
 * costs zero extra reads.
 */
export async function appendChatMessages(repoId: string, messages: Array<Omit<ChatMessage, 'created_at'>>): Promise<void> {
  const nowIso = new Date().toISOString();
  const repoRef = doc(db, 'user_repos', repoId);
  const batch = writeBatch(db);
  messages.forEach((m) => {
    const msgRef = doc(collection(repoRef, 'chat_messages'));
    batch.set(msgRef, { ...m, created_at: nowIso });
  });
  await batch.commit();
}

/**
 * Pulls a repo's current source from GitHub via the getRepoTree Cloud
 * Function and seeds the `files` subcollection with it. Shared by the
 * import flow and the cold-start fallback below — both are "this project
 * has a real GitHub repo, go get its actual content" with the same steps.
 * Throws on failure; callers decide whether that's fatal for their case.
 */
async function hydrateFromGithub(
  repoId: string,
  repoOwner: string,
  repoName: string,
  idToken: string
): Promise<SandpackFiles | null> {
  const response = await fetch(`${FIREBASE_FUNCTION_URL}/getRepoTree`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ owner: repoOwner, repo: repoName }),
  });
  if (!response.ok) throw new Error(`getRepoTree failed (${response.status})`);
  const data = await response.json();
  const treeFiles = data.files as SandpackFiles | undefined;
  if (!treeFiles || Object.keys(treeFiles).length === 0) return null;

  await saveRepoFiles(repoId, treeFiles);
  return patchTsconfigForSandpack(treeFiles);
}

/**
 * Import an existing GitHub repository as a project. Returns the new project
 * id. Creates the Firestore project doc first (getRepoTree's ownership check
 * needs a matching user_repos doc to resolve against), then pulls the repo's
 * real source via hydrateFromGithub — without this, opening the project
 * would silently fall back to the starter template instead of the actual
 * imported code. `idToken` is the caller's Firebase ID token.
 */
export async function createRepoFromGithubUrl(userId: string, repoUrl: string, idToken: string): Promise<string> {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error('Invalid GitHub URL');

  const [, owner, name] = match;
  const cleanName = name.replace(/\.git$/, '');
  const repoId = `${userId}_${cleanName}`;
  const repoRef = doc(db, 'user_repos', repoId);
  const nowIso = new Date().toISOString();

  await setDoc(repoRef, {
    user_id: userId,
    repo_url: `https://github.com/${owner}/${cleanName}`,
    repo_owner: owner,
    repo_name: cleanName,
    created_at: nowIso,
    template_type: 'custom',
    github_sync_status: 'clean',
    pending_edit_count: 0,
    last_edit_at: nowIso,
    last_synced_at: nowIso,
    last_commit_sha: null,
  });

  try {
    await hydrateFromGithub(repoId, owner, cleanName, idToken);
  } catch (error) {
    // Don't fail the import over this — the project doc exists and is
    // usable (BuilderPage falls back to the starter template, or to this
    // same GitHub pull again via hydrateRepoFilesFromGithubIfEmpty on next
    // open), just without its real content yet.
    console.error('Failed to hydrate imported repo from GitHub:', error);
  }

  return repoId;
}

/**
 * Cold-start fallback (see docs/AI_BUILDER_ENGINE.md Figure 2): if a
 * project's Firestore file cache is empty but it has a real GitHub repo
 * behind it (repo_url is set), pull from GitHub and re-seed the cache
 * instead of silently opening the project on the starter template. Returns
 * the pulled files, or null if there's nothing to fall back to / the pull
 * failed — callers should use DEFAULT_FILES in that case.
 */
export async function hydrateRepoFilesFromGithubIfEmpty(repo: Repo, idToken: string): Promise<SandpackFiles | null> {
  if (!repo.repo_url || !repo.repo_owner || !repo.repo_name) return null;
  try {
    return await hydrateFromGithub(repo.id, repo.repo_owner, repo.repo_name, idToken);
  } catch (error) {
    console.error('GitHub cold-start fallback failed:', error);
    return null;
  }
}

/**
 * Create a project seeded from one of the built-in templates. Returns the
 * new project id. Currently unreachable from the UI — Platform.tsx's
 * template cards go through createRepoFromPrompt instead — but kept
 * consistent with it anyway: previously this set a fake
 * `github.com/empirial-templates/...` repo_url/repo_owner that the shared
 * GITHUB_TOKEN can't actually push to, which syncRepoToGitHub's "no
 * repo_url yet" guard wouldn't have caught (it had a — fake — truthy URL).
 * Now it uses the same "no real GitHub repo yet" convention as
 * createRepoFromPrompt, so if this does get wired up later it no-ops
 * cleanly through that guard instead of retrying a doomed push forever.
 */
export async function createRepoFromTemplate(
  userId: string,
  template: { id: string; name: string },
  projectName: string
): Promise<string> {
  const repoId = `${userId}_${projectName}`;
  const repoRef = doc(db, 'user_repos', repoId);
  const nowIso = new Date().toISOString();

  const batch = writeBatch(db);
  batch.set(repoRef, {
    user_id: userId,
    repo_url: '',
    repo_owner: 'empirial-ai',
    repo_name: projectName,
    created_at: nowIso,
    template_id: template.id,
    status: 'ready',
    github_sync_status: 'clean',
    pending_edit_count: 0,
    last_edit_at: nowIso,
    last_synced_at: nowIso,
    last_commit_sha: null,
  });
  Object.entries(DEFAULT_FILES).forEach(([path, file]) => {
    const relativePath = toRelativePath(path);
    const fileRef = doc(collection(repoRef, 'files'), encodeURIComponent(relativePath));
    batch.set(fileRef, { path: relativePath, content: file.code, updated_at: nowIso });
  });
  await batch.commit();

  return repoId;
}

/**
 * Create a brand-new AI-generated project. There's no GitHub repo behind it
 * yet (repo_url stays empty) — functions/index.js's syncRepoToGitHub treats
 * an empty repo_url as "not GitHub-backed yet" and no-ops instead of trying
 * to push to a repo that doesn't exist. It becomes syncable the moment
 * something gives it a real repo_owner/repo_url (e.g. a future "push to
 * GitHub" action, or createWebsite's repo-creation flow).
 */
export async function createRepoFromPrompt(userId: string, prompt: string): Promise<string> {
  const projectName = slugify(prompt.slice(0, 40));
  const repoId = `${userId}_${projectName}`;
  const repoRef = doc(db, 'user_repos', repoId);
  const nowIso = new Date().toISOString();

  const batch = writeBatch(db);
  batch.set(repoRef, {
    user_id: userId,
    repo_url: '',
    repo_owner: 'empirial-ai',
    repo_name: prompt.trim().slice(0, 60) || projectName,
    created_at: nowIso,
    template_type: 'ai-generated',
    github_sync_status: 'clean',
    pending_edit_count: 0,
    last_edit_at: nowIso,
    last_synced_at: nowIso,
    last_commit_sha: null,
  });
  Object.entries(DEFAULT_FILES).forEach(([path, file]) => {
    const relativePath = toRelativePath(path);
    const fileRef = doc(collection(repoRef, 'files'), encodeURIComponent(relativePath));
    batch.set(fileRef, { path: relativePath, content: file.code, updated_at: nowIso });
  });
  await batch.commit();

  return repoId;
}

/**
 * Create a brand-new AI-generated project the "real" way: calls the
 * createWebsite Cloud Function, which creates an actual GitHub repo, runs
 * the full multi-agent pipeline to generate every section, commits the
 * result to that repo, and seeds Firestore — all server-side in one call.
 * This is what BuilderPage's fresh-prompt path uses now; createRepoFromPrompt
 * above is kept only as the plain local-starter-template fallback it always
 * was, not called from the UI anymore. Can take a while (full generation +
 * one GitHub API call per file), matching createWebsite's own 300s timeout.
 */
export async function createWebsiteFromPrompt(userId: string, idToken: string, prompt: string): Promise<string> {
  const response = await fetch(`${FIREBASE_FUNCTION_URL}/createWebsite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ prompt }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `createWebsite failed (${response.status})`);

  const repoName = data.repo?.name;
  if (!repoName) throw new Error('createWebsite did not return a repo name');
  // Matches the exact repoId convention createWebsite itself writes to
  // Firestore (`${userId}_${repoName}`) — see functions/index.js.
  return `${userId}_${repoName}`;
}

/**
 * Create a brand-new AI-generated document: calls the generateDocument
 * Cloud Function, which runs the document-builder agent, renders the
 * result to a PDF, uploads it to Storage, and seeds Firestore — all
 * server-side in one call, the same shape as createWebsiteFromPrompt above
 * but for documents instead of websites. Unlike that function, the backend
 * hands back the repoId directly (no client-side reconstruction needed)
 * since there's no repo name collision/rename concern to route around.
 * `userId` isn't sent anywhere (the backend derives it from `idToken`) —
 * kept as a parameter only so call sites read the same as
 * createWebsiteFromPrompt's, which does need it.
 */
export async function generateDocumentFromPrompt(_userId: string, idToken: string, prompt: string): Promise<string> {
  const response = await fetch(`${FIREBASE_FUNCTION_URL}/generateDocument`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ prompt }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `generateDocument failed (${response.status})`);

  const repoId = data.repoId;
  if (!repoId) throw new Error('generateDocument did not return a project id');
  return repoId;
}

/**
 * Delete a project and every doc in its `files` and `chat_messages`
 * subcollections. Firestore doesn't cascade-delete subcollections —
 * skipping this would silently orphan every file/message doc a project
 * ever had.
 */
export async function deleteRepo(repoId: string): Promise<void> {
  const repoRef = doc(db, 'user_repos', repoId);
  const [filesSnap, chatSnap] = await Promise.all([
    getDocs(collection(repoRef, 'files')),
    getDocs(collection(repoRef, 'chat_messages')),
  ]);

  const batch = writeBatch(db);
  filesSnap.docs.forEach((fileDoc) => batch.delete(fileDoc.ref));
  chatSnap.docs.forEach((msgDoc) => batch.delete(msgDoc.ref));
  batch.delete(repoRef);
  await batch.commit();
}

async function callFunction<T>(name: string, idToken: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${FIREBASE_FUNCTION_URL}/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `${name} failed (${response.status})`);
  return data as T;
}

export interface PublishResult {
  success: true;
  status: 'BUILDING' | 'READY' | 'ERROR';
  url?: string;
  deploymentId: string;
}

/**
 * Publishes a project to Vercel production — see functions/index.js's
 * publishWebsite. Flushes pending Firestore edits to GitHub first, then
 * ensures a Vercel project exists and triggers a deployment. Can take up to
 * ~45s (the function's own poll window) before returning; a status of
 * "BUILDING" means it's still going and the caller should poll
 * getDeploymentStatus.
 */
export async function publishWebsite(repoId: string, idToken: string): Promise<PublishResult> {
  return callFunction<PublishResult>('publishWebsite', idToken, { repoId });
}

/** Polls the current Vercel deployment status for a project. */
export async function getDeploymentStatus(repoId: string, idToken: string): Promise<{ status: string; url?: string }> {
  const response = await fetch(`${FIREBASE_FUNCTION_URL}/getDeploymentStatus?repoId=${encodeURIComponent(repoId)}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `getDeploymentStatus failed (${response.status})`);
  return data;
}

export interface ThemeColorResult {
  success: true;
  path: 'src/index.css';
  content: string;
  palette: { baseHue: number; accentHue: number; accentSaturation: number };
}

/**
 * Deterministic color change — no chat/LLM round trip. See
 * functions/index.js's setThemeColor: this is a pure function, not a model
 * classification, so there's nothing for it to misinterpret. Callers should
 * apply `content` to the live Sandpack file themselves (see ThemeButton.tsx)
 * so the preview updates immediately rather than waiting on a reload.
 */
export async function setThemeColor(
  repoId: string,
  idToken: string,
  palette: { baseHue: number; accentHue: number; accentSaturation: number }
): Promise<ThemeColorResult> {
  return callFunction<ThemeColorResult>('setThemeColor', idToken, { repoId, ...palette });
}

/** Forces an immediate GitHub sync of the current Firestore file cache. */
export async function requestRepoSync(repoId: string, idToken: string): Promise<{ success: boolean; synced: boolean }> {
  return callFunction('requestRepoSync', idToken, { repoId });
}

export interface SeoAuditResult {
  score: number;
  checks: Record<string, boolean>;
}

/** Runs the technical-SEO readiness audit against a project's live GitHub content — see functions/seo/audit.js. */
export async function runSeoAudit(repoId: string, idToken: string): Promise<SeoAuditResult> {
  return callFunction<SeoAuditResult>('seoAudit', idToken, { repoId });
}

/** Requests a Google OAuth URL to connect Search Console for a project — caller should navigate to the returned url. */
export async function getGoogleConnectUrl(idToken: string, repoId?: string): Promise<string> {
  const qs = repoId ? `?repoId=${encodeURIComponent(repoId)}` : '';
  const response = await fetch(`${FIREBASE_FUNCTION_URL}/googleConnect${qs}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `googleConnect failed (${response.status})`);
  return data.url as string;
}

/** Step 1 of Google ownership verification — fetches the META token to embed (via the next Publish). */
export async function requestGoogleVerificationToken(repoId: string, idToken: string): Promise<{ token: string; instructions: string }> {
  return callFunction('googleVerify', idToken, { repoId, step: 'get-token' });
}

/** Step 2 — confirms the META tag is live and records the verified property. Call only after republishing. */
export async function confirmGoogleVerification(repoId: string, idToken: string): Promise<{ success: boolean; siteUrl: string }> {
  return callFunction('googleVerify', idToken, { repoId, step: 'confirm' });
}

/** Submits sitemap.xml to Search Console once a property is verified. */
export async function submitSitemapToGoogle(repoId: string, idToken: string): Promise<{ success: boolean; sitemapUrl: string }> {
  return callFunction('googleSubmitSitemap', idToken, { repoId });
}

export interface SearchPerformance {
  connected: boolean;
  hasData?: boolean;
  clicks?: number;
  impressions?: number;
  ctr?: number;
  avgPosition?: number;
  topQueries?: Array<{ query: string; clicks: number; impressions: number }>;
}

/** Reads the last-28-days Search Analytics summary for a connected, verified project. */
export async function getSearchPerformance(repoId: string, idToken: string): Promise<SearchPerformance> {
  const response = await fetch(`${FIREBASE_FUNCTION_URL}/googleSearchPerformance?repoId=${encodeURIComponent(repoId)}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `googleSearchPerformance failed (${response.status})`);
  return data;
}

async function callFunctionGet<T>(name: string, idToken: string, params: Record<string, string> = {}): Promise<T> {
  const qs = Object.keys(params).length ? `?${new URLSearchParams(params).toString()}` : '';
  const response = await fetch(`${FIREBASE_FUNCTION_URL}/${name}${qs}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `${name} failed (${response.status})`);
  return data as T;
}

// ---------------------------------------------------------------------
// Growth surface — PageSpeed, uptime, real reviews, Business Profile,
// custom domain. See features/platform/pages/Growth.tsx, the one page all
// of these are consumed from.
// ---------------------------------------------------------------------

export type PageSpeedResult = NonNullable<Repo['pagespeed_audit']>;

/** Runs PageSpeed Insights against a project's live URL — see functions/integrations/google/pagespeed.js. Requires the project to be published first. */
export async function runPageSpeedAudit(repoId: string, idToken: string, strategy: 'mobile' | 'desktop' = 'mobile'): Promise<PageSpeedResult> {
  return callFunction<PageSpeedResult>('pageSpeedAudit', idToken, { repoId, strategy });
}

export interface UptimeStatusResult {
  monitored: boolean;
  status?: Repo['uptime_status'];
  uptimeRatio30d?: number | null;
  checkedAt?: string;
}

/** Creates an UptimeRobot monitor for a project's live URL. */
export async function enableUptimeMonitoring(repoId: string, idToken: string): Promise<{ monitorId: string; status: string }> {
  return callFunction('enableUptimeMonitoring', idToken, { repoId });
}

/** Polls the current status of a project's uptime monitor, if any. */
export async function getUptimeStatus(repoId: string, idToken: string): Promise<UptimeStatusResult> {
  return callFunctionGet<UptimeStatusResult>('getUptimeStatus', idToken, { repoId });
}

/** Deletes the monitor and clears the project's uptime fields. */
export async function disableUptimeMonitoring(repoId: string, idToken: string): Promise<{ success: boolean }> {
  return callFunction('disableUptimeMonitoring', idToken, { repoId });
}

export interface PlaceCandidate {
  placeId: string;
  name?: string;
  address?: string;
  rating?: number;
  reviewCount?: number;
}

/** Searches Google Places for a business, so the user can confirm which result is theirs before linking one — see functions/integrations/google/places.js. */
export async function findGooglePlace(query: string, idToken: string): Promise<PlaceCandidate[]> {
  const { candidates } = await callFunction<{ candidates: PlaceCandidate[] }>('findGooglePlace', idToken, { query });
  return candidates;
}

/** Links a confirmed placeId to a project — its reviews then feed real testimonials on the next build/edit that touches that section. */
export async function linkGooglePlace(repoId: string, placeId: string, idToken: string): Promise<{ success: boolean }> {
  return callFunction('linkGooglePlace', idToken, { repoId, placeId });
}

export interface GoogleReview {
  name: string;
  avatarUrl?: string | null;
  rating: number;
  text: string;
  relativeTime: string;
}

export interface GoogleReviewsResult {
  name?: string;
  rating?: number;
  reviewCount?: number;
  reviews: GoogleReview[];
}

/** Fetches the current reviews for a project's linked Google Place. */
export async function getGoogleReviews(repoId: string, idToken: string): Promise<GoogleReviewsResult> {
  return callFunctionGet<GoogleReviewsResult>('getGoogleReviews', idToken, { repoId });
}

export interface BusinessAccount { name: string; accountName?: string; type?: string }
export interface BusinessLocation {
  name: string;
  title?: string;
  phoneNumbers?: { primaryPhone?: string };
  websiteUri?: string;
  storefrontAddress?: { addressLines?: string[]; locality?: string };
}

/** Lists the Google Business accounts available to the connected Google user. Requires Google's separate Business Profile API approval — see businessProfile.js's own comment. */
export async function getBusinessAccounts(idToken: string): Promise<BusinessAccount[]> {
  const { accounts } = await callFunctionGet<{ accounts: BusinessAccount[] }>('businessProfileAccounts', idToken);
  return accounts;
}

export async function getBusinessLocations(accountName: string, idToken: string): Promise<BusinessLocation[]> {
  const { locations } = await callFunctionGet<{ locations: BusinessLocation[] }>('businessProfileLocations', idToken, { accountName });
  return locations;
}

/** Reads the Business Profile location currently linked to a project. */
export async function getLinkedBusinessLocation(repoId: string, idToken: string): Promise<BusinessLocation> {
  return callFunctionGet<BusinessLocation>('businessProfileLocation', idToken, { repoId });
}

/** Patches a narrow, safe subset of a location's fields (hours/phone/website/description) and links it to the project if not already. */
export async function updateBusinessLocation(repoId: string, locationName: string, patch: Record<string, unknown>, idToken: string): Promise<BusinessLocation> {
  return callFunction('businessProfileUpdateLocation', idToken, { repoId, locationName, patch });
}

/** Creates a Google Business local post (update/offer/event) for the project's linked location. */
export async function createBusinessPost(repoId: string, post: Record<string, unknown>, idToken: string): Promise<{ name: string }> {
  return callFunction('businessProfilePost', idToken, { repoId, post });
}

export interface DomainConfig {
  misconfigured?: boolean;
  [key: string]: unknown;
}

/** Attaches a custom domain to a project's Vercel deployment. Requires the project to already be published via Vercel. */
export async function connectDomain(repoId: string, domain: string, idToken: string): Promise<{ domain: string; config: DomainConfig }> {
  return callFunction('connectDomain', idToken, { repoId, domain });
}

/** Re-checks a connected domain's DNS/verification status. */
export async function getDomainStatus(repoId: string, idToken: string): Promise<{ connected: boolean; domain?: string; status?: Repo['custom_domain_status']; config?: DomainConfig }> {
  return callFunctionGet('getDomainStatus', idToken, { repoId });
}

/** Removes a project's custom domain. */
export async function disconnectDomain(repoId: string, idToken: string): Promise<{ success: boolean }> {
  return callFunction('disconnectDomain', idToken, { repoId });
}
