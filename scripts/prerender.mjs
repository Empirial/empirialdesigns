// Build-time prerendering for the public marketing routes.
//
// This is a client-rendered SPA (Vite + React Router, no SSR) — Google can
// eventually execute the JS and index a CSR page, but it's slower and less
// reliable than a crawler getting real HTML on the first response. Rather
// than migrate the whole app to SSR, this script runs *after* `vite build`:
// it serves the real `dist/` output from a tiny in-process static server
// that mirrors the "**" -> /index.html rewrite in firebase.json, visits
// each public route in a headless browser, waits for React to render and
// for the useSeo() effect to patch <head>, and writes the resulting HTML
// to disk as that route's own static index.html — e.g.
// dist/web-design-limpopo/index.html.
//
// (An earlier version of this script shelled out to `firebase serve` to get
// that same rewrite behaviour, but the CLI's subprocess was flaky to drive
// non-interactively — intermittent hangs and startup failures. A ~30-line
// http.Server has none of that and gives the same routing.)
//
// The browser bundle is untouched: once a visitor's JS loads, ReactDOM
// takes over the #root the normal way (a fresh client render on top of the
// prerendered markup), so this only changes what a crawler — or a
// JS-disabled fetch — sees on first load. Same technique as
// prerender-spa-plugin / react-snap.
//
// Best-effort: any failure here logs and exits 0 rather than failing the
// build — the SPA in dist/ is fully valid without it.
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
};

// Public, indexable routes only — /dashboard, /auth, /staff are app/auth
// surfaces, already excluded via robots.txt, and skipped here too.
const ROUTES = [
  '/',
  '/services',
  '/portfolio',
  '/about',
  '/contact',
  '/web-design-limpopo',
  '/web-design-mpumalanga',
  '/web-design-gauteng',
];

function startStaticServer() {
  const server = createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    let filePath = path.join(distDir, urlPath);
    // Mirrors firebase.json's hosting.rewrites: any path without a real
    // file on disk falls back to the SPA shell.
    if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, 'index.html');
    }
    const ext = path.extname(filePath);
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
    createReadStream(filePath).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

async function main() {
  const { server, baseUrl } = await startStaticServer();

  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    for (const route of ROUTES) {
      const url = `${baseUrl}${route}`;
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      // Let the useSeo() effect (title/meta/canonical/JSON-LD) run.
      await page.waitForTimeout(300);
      const html = await page.content();

      const outDir = route === '/' ? distDir : path.join(distDir, route.slice(1));
      await mkdir(outDir, { recursive: true });
      await writeFile(path.join(outDir, 'index.html'), `<!doctype html>\n${html}`, 'utf8');
      console.log(`[prerender] wrote ${path.relative(root, path.join(outDir, 'index.html'))}`);
    }

    await browser.close();
  } finally {
    server.close();
  }
}

main().catch((err) => {
  console.error('[prerender] skipped — build output in dist/ is still valid without it.');
  console.error(err);
  process.exit(0);
});
