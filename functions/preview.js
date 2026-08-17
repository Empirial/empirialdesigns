// Real hero-section preview screenshots for My Projects cards — see
// Platform.tsx's mapRepoToProject on the client side, which prefers
// repo.preview_image_url once a project has one.
//
// The pipeline: bundle the project's actual saved source (esbuild, against
// an in-memory file map — no real bundler install, no filesystem) into a
// single self-contained HTML page, screenshot it with headless Chromium,
// upload the JPEG to Storage, and write the resulting URL onto the repo doc.
//
// Heavy deps (esbuild, puppeteer-core, @sparticuz/chromium) are required
// lazily inside the functions that use them, not at module scope — mirrors
// index.js's own require-timing discipline (see its top-of-file comment):
// Firebase's deploy-time static analysis loads every function file fresh
// with a hard timeout just to discover `exports.foo` signatures, and fully
// resolving these packages' dependency trees at that point blows that
// budget. firebase-admin/crypto are cheap, so those stay eager.
const admin = require('firebase-admin');
const crypto = require('crypto');

const VIEWPORT = { width: 1280, height: 800 };
// react/jsx-runtime: esbuild's automatic JSX transform (jsx: 'automatic'
// below) emits `import { jsx, jsxs } from "react/jsx-runtime"` itself, even
// though no source file ever imports it directly — has to be external and
// in the import map too, or the bundle throws at runtime instead of build time.
const EXTERNAL_MODULES = ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', 'lucide-react'];

/**
 * Bundles, screenshots, uploads, and records a preview for one repo.
 * Every caller wraps this in try/catch and treats a failure as "no preview
 * yet" — never as a reason to fail the larger request it's attached to
 * (initial generation / a save).
 *
 * @param {string} repoId
 * @param {string} userId - repo owner; previews live under users/{userId}/...
 *   to match storage.rules' ownership model.
 * @param {{path: string, content: string}[]} files - repo-relative paths
 *   (no leading slash), e.g. "src/App.tsx" — the shape createWebsite
 *   assembles and the `files` Firestore subcollection stores (see
 *   repos.service.ts's saveRepoFiles).
 * @return {Promise<string>} the preview's permanent download URL.
 */
async function captureRepoPreview(repoId, userId, files) {
  const html = await buildPreviewHtml(files);
  const jpegBuffer = await screenshotHtml(html);
  const url = await uploadPreview(userId, repoId, jpegBuffer);
  await admin.firestore().collection('user_repos').doc(repoId).update({
    preview_image_url: url,
    preview_updated_at: new Date().toISOString(),
  });
  return url;
}

/**
 * Re-reads a repo's current files straight from Firestore — not GitHub;
 * saves land in Firestore immediately, GitHub is only synced at creation /
 * chat-edit time (see saveRepoFiles's own comment) — and re-captures its
 * preview. Used after a manual save, where (unlike createWebsite) the
 * caller doesn't already have the files in memory.
 *
 * @param {string} repoId
 * @return {Promise<string>} the preview's permanent download URL.
 */
async function regeneratePreviewFromFirestore(repoId) {
  const db = admin.firestore();
  const repoSnap = await db.collection('user_repos').doc(repoId).get();
  if (!repoSnap.exists) throw new Error('Repo not found');
  const repo = repoSnap.data();

  const filesSnap = await db.collection('user_repos').doc(repoId).collection('files').get();
  const files = filesSnap.docs
    .map((d) => d.data())
    .filter((f) => f.path && typeof f.content === 'string')
    .map((f) => ({ path: f.path, content: f.content }));

  if (files.length === 0) throw new Error('No files saved for this repo yet');
  return captureRepoPreview(repoId, repo.user_id, files);
}

/**
 * esbuild-bundles src/main.tsx (the real Vite entry every generated repo has
 * — see index.js's getShellFiles) against the in-memory files map. react /
 * react-dom / lucide-react are left external and resolved at render time via
 * an import map pointing at esm.sh, so this never needs a real
 * node_modules install to produce a renderable bundle.
 * @param {{path: string, content: string}[]} files
 * @return {Promise<string>} a complete, self-contained HTML document.
 */
async function buildPreviewHtml(files) {
  const esbuild = require('esbuild');

  const byPath = new Map(files.map((f) => [normalize(f.path), f.content]));
  const cssContent = byPath.get('src/index.css') || '';
  const entry = ['src/main.tsx', 'src/main.ts', 'src/index.tsx'].find((p) => byPath.has(p));
  if (!entry) throw new Error('No entry file (src/main.tsx) found to render');

  // Entirely virtual — no real file on disk is ever touched, including the
  // entry point itself, so every importer path esbuild hands back to
  // onResolve is one of our own forward-slash relative paths (e.g.
  // "src/main.tsx"), never a real OS path. Mixing in a real filesystem
  // resolveDir/sourcefile (as an esbuild `stdin` entry would) broke that:
  // on Windows, esbuild resolved the entry's own importer to a real
  // backslashed "D:\...\functions\src\main.tsx" path, which resolveVirtualPath's
  // forward-slash joinPath logic couldn't parse — every relative import in
  // the entry file failed to resolve.
  const virtualFsPlugin = {
    name: 'virtual-fs',
    setup(build) {
      // kind === 'entry-point' is esbuild's very first resolve call, for
      // `entry` itself — intercepting it here (mapping it to the same path,
      // just in the 'virtual' namespace) keeps it from ever touching
      // esbuild's real, disk-based default resolver, so every importer path
      // it later hands back to this hook for that file's own imports stays
      // one of our plain forward-slash relative strings (e.g.
      // "src/main.tsx") that resolveVirtualPath's joinPath can parse.
      build.onResolve({ filter: /.*/ }, (args) => {
        if (args.kind === 'entry-point') return { path: entry, namespace: 'virtual' };
        if (EXTERNAL_MODULES.includes(args.path)) return { path: args.path, external: true };
        if (args.path.endsWith('.css')) return { path: args.path, namespace: 'css-ignore' };
        if (!args.path.startsWith('.') && !args.path.startsWith('@/')) {
          // Anything else (an npm package name) — treat as external too
          // rather than failing the whole render over one decorative
          // dependency the hero doesn't strictly need to show.
          return { path: args.path, external: true };
        }
        const resolved = resolveVirtualPath(args.path, args.importer, byPath);
        if (!resolved) throw new Error(`Cannot resolve "${args.path}" from "${args.importer}"`);
        return { path: resolved, namespace: 'virtual' };
      });
      build.onLoad({ filter: /.*/, namespace: 'virtual' }, (args) => ({
        contents: byPath.get(args.path),
        loader: loaderFor(args.path),
      }));
      // CSS imports (e.g. "./index.css") are handled by injecting the
      // already-compiled stylesheet straight into the HTML shell instead —
      // see compileTailwindCss in index.js, which has already turned this
      // into real static CSS by the time these files are saved.
      build.onLoad({ filter: /.*/, namespace: 'css-ignore' }, () => ({ contents: '', loader: 'js' }));
    },
  };

  const result = await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    format: 'esm',
    jsx: 'automatic',
    jsxImportSource: 'react',
    target: 'es2020',
    external: EXTERNAL_MODULES,
    plugins: [virtualFsPlugin],
    logLevel: 'silent',
  });

  const bundledJs = result.outputFiles[0].text;
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  html, body { margin: 0; padding: 0; background: #fff; }
  ${cssContent}
</style>
<script type="importmap">
{"imports": {
  "react": "https://esm.sh/react@18.3.1",
  "react/jsx-runtime": "https://esm.sh/react@18.3.1/jsx-runtime",
  "react-dom": "https://esm.sh/react-dom@18.3.1",
  "react-dom/client": "https://esm.sh/react-dom@18.3.1/client",
  "lucide-react": "https://esm.sh/lucide-react@0.462.0?deps=react@18.3.1"
}}
</script>
</head>
<body>
<div id="root"></div>
<script type="module">${bundledJs}</script>
</body>
</html>`;
}

function normalize(path) {
  return path.startsWith('/') ? path.slice(1) : path;
}

function loaderFor(path) {
  if (path.endsWith('.tsx')) return 'tsx';
  if (path.endsWith('.ts')) return 'ts';
  if (path.endsWith('.jsx')) return 'jsx';
  return 'js';
}

// Mimics just enough of TS module resolution for this closed set of files:
// relative imports, extension-less imports (tries .tsx/.ts/.jsx/.js/index),
// and the "@/..." alias every generated file uses (see BASE_FILES's
// tsconfig.json in index.js — "@/*" maps to "src/*").
function resolveVirtualPath(importPath, importer, byPath) {
  let base;
  if (importPath.startsWith('@/')) {
    base = 'src/' + importPath.slice(2);
  } else {
    const dir = importer.includes('/') ? importer.slice(0, importer.lastIndexOf('/')) : '';
    base = joinPath(dir, importPath);
  }
  const candidates = [base, `${base}.tsx`, `${base}.ts`, `${base}.jsx`, `${base}.js`, `${base}/index.tsx`, `${base}/index.ts`];
  return candidates.find((c) => byPath.has(c)) || null;
}

function joinPath(dir, rel) {
  const stack = dir ? dir.split('/') : [];
  for (const part of rel.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') stack.pop();
    else stack.push(part);
  }
  return stack.join('/');
}

/**
 * Headless-Chromium screenshot of just the first viewport (the hero
 * section), not the full scrollable page.
 * @param {string} html
 * @return {Promise<Buffer>} a JPEG buffer.
 */
async function screenshotHtml(html) {
  const chromium = require('@sparticuz/chromium');
  const puppeteer = require('puppeteer-core');

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: VIEWPORT,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  try {
    const page = await browser.newPage();
    // 'load', not 'networkidle0': the page's only network activity is the
    // React/lucide-react module graph loading from esm.sh (react, jsx-runtime,
    // react-dom/client, scheduler, lucide-react itself — several chained
    // fetches), and 'load' already waits for the module <script> to finish
    // executing before it fires. 'networkidle0' additionally demands zero
    // in-flight connections for 500ms straight, which esm.sh's CDN
    // round-trips (plus any keep-alive connections) can miss on real network
    // latency — confirmed hanging past 20s in local testing even after the
    // page had actually finished rendering correctly.
    await page.setContent(html, { waitUntil: 'load', timeout: 30000 });
    // Give web fonts / any late-settling layout a beat before the shot —
    // avoids a screenshot of a still-reflowing page.
    await new Promise((resolve) => setTimeout(resolve, 500));
    return await page.screenshot({ type: 'jpeg', quality: 82 });
  } finally {
    await browser.close();
  }
}

/**
 * Uploads under users/{userId}/... (matches storage.rules' ownership model)
 * and mints a Firebase download-token URL — permanent, unlike a signed URL
 * (which would need re-minting every few days), and doesn't require
 * loosening storage.rules to allow public reads. Same pattern
 * generateDocument uses for its PDFs — see storage.rules' own comment.
 * @param {string} userId
 * @param {string} repoId
 * @param {Buffer} buffer
 * @return {Promise<string>}
 */
async function uploadPreview(userId, repoId, buffer) {
  const bucket = admin.storage().bucket();
  const path = `users/${userId}/repo-previews/${repoId}.jpg`;
  const file = bucket.file(path);
  const token = crypto.randomUUID();

  await file.save(buffer, {
    contentType: 'image/jpeg',
    metadata: { metadata: { firebaseStorageDownloadTokens: token } },
  });

  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

module.exports = {
  captureRepoPreview,
  regeneratePreviewFromFirestore,
  // Exported for testing (see functions/README or the test script that
  // exercises these directly without live Firestore/Storage credentials) —
  // not otherwise used outside this module.
  buildPreviewHtml,
  screenshotHtml,
};
