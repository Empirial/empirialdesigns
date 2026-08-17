const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const fetch = require("node-fetch");
// postcss/tailwindcss/autoprefixer are required lazily, inside
// compileTailwindCss() — not here at module scope. Firebase's deploy-time
// static analysis loads this file in a fresh process with a hard 10s budget
// just to discover the `exports.foo = ...` signatures; fully resolving
// tailwindcss's dependency tree at that point (rather than at actual
// invocation time, under normal function-execution timeouts) blew that
// budget and failed every deploy with "Cannot determine backend
// specification. Timeout after 10000." (also mitigated by the
// FUNCTIONS_DISCOVERY_TIMEOUT=60 the deploy script now sets — see
// package.json — but keeping heavy requires lazy is still the right call).
// pipeline.js itself is cheap to load (no heavy transitive deps beyond
// node-fetch, already required above), so it's safe to require eagerly.
const { runPipeline, SECTION_FILES } = require("./pipeline");
const { buildIndexCssFile, clampHue, clampSaturation } = require("./agents/shared");
// Cheap to require eagerly, same as pipeline.js above — preview.js's own
// heavy deps (esbuild, puppeteer-core, @sparticuz/chromium) are required
// lazily inside its functions, not at its module scope.
const { captureRepoPreview, regeneratePreviewFromFirestore } = require("./preview");
// All four of these are cheap to require eagerly (raw-fetch wrappers, no
// heavy transitive deps — see functions/integrations/vercel/client.js's own
// comment on why that's a deliberate choice, not an oversight) — same
// reasoning as pipeline.js/preview.js above.
const { buildSeoManifest } = require("./seo/manifest");
const { injectHeadTags, renderVerificationTag } = require("./seo/metadata");
const { buildSitemap } = require("./seo/sitemap");
const { buildRobotsTxt } = require("./seo/robots");
const { buildStructuredDataScript } = require("./seo/structuredData");
const { auditFiles } = require("./seo/audit");
const { ensureVercelProject, createProductionDeployment, getDeployment, pollDeployment, mapReadyState } = require("./integrations/vercel/publish");
const { buildAuthUrl, exchangeCodeForTokens, getValidAccessToken } = require("./integrations/google/oauth");
const { getVerificationToken, verifySite } = require("./integrations/google/verification");
const { addSite, submitSitemap: submitSitemapToGoogle, getSearchAnalytics, inspectUrl } = require("./integrations/google/searchConsole");
const { MAX_IMAGES_PER_SITE, buildImagePrompt, generateImage: generateOpenRouterImage } = require("./integrations/openrouter/imageGeneration");
const { runPageSpeed } = require("./integrations/google/pagespeed");
const { createMonitor: createUptimeMonitor, getMonitorStatus: getUptimeMonitorStatus, deleteMonitor: deleteUptimeMonitor } = require("./integrations/uptime/uptimeRobot");
const { findPlace: findGooglePlaceCandidates, getPlaceReviews } = require("./integrations/google/places");
const { listAccounts: listBusinessAccounts, listLocations: listBusinessLocations, getLocation: getBusinessLocation, updateLocation: updateBusinessLocation, createLocalPost } = require("./integrations/google/businessProfile");
const { addDomainToProject, getDomainConfig, removeDomainFromProject } = require("./integrations/vercel/domains");

admin.initializeApp();
const db = admin.firestore();

// --- STATIC TEMPLATES ---
const BASE_FILES = {
  'vite.config.ts': `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));`,
  'tsconfig.json': `{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}`,
  'tsconfig.app.json': `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}`,
  'tsconfig.node.json': `{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true
  },
  "include": ["vite.config.ts"]
}`,
  'tailwind.config.ts': `import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};`,
  'postcss.config.js': `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
  '.gitignore': `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
.env
`
};

// Mirrors BASE_FILES['tailwind.config.ts'] above exactly (as a real JS
// object, not a string a bundler would need to parse) — the config every
// generated site is told it already has. Used to compile real, static CSS
// server-side instead of shipping raw @tailwind directives — see
// compileTailwindCss below for why that's necessary. A function, not a
// plain object, so the tailwindcss-animate require stays lazy too — see the
// require-timing comment at the top of the file.
function getTailwindConfig() {
  return {
    darkMode: ["class"],
    prefix: "",
    theme: {
      container: {
        center: true,
        padding: "2rem",
        screens: { "2xl": "1400px" },
      },
      extend: {
        colors: {
          border: "hsl(var(--border))",
          input: "hsl(var(--input))",
          ring: "hsl(var(--ring))",
          background: "hsl(var(--background))",
          foreground: "hsl(var(--foreground))",
          primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
          secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
          destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
          muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
          accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
          popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
          card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        },
        borderRadius: {
          lg: "var(--radius)",
          md: "calc(var(--radius) - 2px)",
          sm: "calc(var(--radius) - 4px)",
        },
        keyframes: {
          "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
          "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        },
        animation: {
          "accordion-down": "accordion-down 0.2s ease-out",
          "accordion-up": "accordion-up 0.2s ease-out",
        },
      },
    },
    plugins: [require("tailwindcss-animate")],
  };
}

// Extensions Tailwind's JIT scanner should actually read for class names —
// everything else (json/css/svg/etc.) would just be wasted scanning.
const TAILWIND_SCAN_EXTENSIONS = new Set(["tsx", "ts", "jsx", "js", "html"]);

// Sandpack's react-ts template bundler never runs PostCSS/Tailwind — it
// treats @tailwind base/components/utilities as three unrecognized at-rules
// and drops them, so every Tailwind class in every generated component
// silently resolves to nothing (raw unstyled HTML, browser default link
// blue, no spacing) even though the generated code is entirely correct.
// Rather than depend on Sandpack ever gaining that capability, this compiles
// real, static CSS once at generation time — using the exact same content
// (every file, so the JIT scanner sees every className used) and the exact
// same theme (getTailwindConfig above) a real `npx tailwindcss build` would
// — and overwrites the generated src/index.css with the compiled output
// before anything is committed or saved. Sandpack (and any real browser)
// renders plain compiled CSS natively, no special handling required.
async function compileTailwindCss(files) {
  const cssFile = files.find((f) => f.path === "src/index.css");
  if (!cssFile) {
    console.warn("compileTailwindCss: no src/index.css in generated files, skipping");
    return files;
  }

  // Lazy requires — see the comment at the top of the file for why these
  // can't be top-level.
  const postcss = require("postcss");
  const tailwindcss = require("tailwindcss");
  const autoprefixer = require("autoprefixer");

  const content = files
    .filter((f) => TAILWIND_SCAN_EXTENSIONS.has(f.path.split(".").pop()))
    .map((f) => ({ raw: f.content, extension: f.path.split(".").pop() }));

  const config = { ...getTailwindConfig(), content };
  const result = await postcss([tailwindcss(config), autoprefixer]).process(cssFile.content, { from: undefined });

  cssFile.content = result.css;
  return files;
}

// The DeepSeek pipeline (pipeline.js / agents/*) only ever produces the 6
// section components (SECTION_FILES: nav/hero/about/services/testimonials/
// footer) — never the app shell around them, with one exception: a chat edit
// that explicitly asks to recolor the site emits a fresh src/index.css block
// itself (pipeline.js's recolor path) using the exact same
// agents/shared.js#buildIndexCssFile this function calls below, so a
// recolored file is byte-for-byte what a fresh create would have produced.
// These 5 files are otherwise the deterministic shell: a fresh build never
// depends on a model call to produce working boilerplate. App.tsx renders
// the 6 sections in a fixed order; index.css carries the shadcn/ui-standard
// HSL variable set tailwind.config.ts's semantic tokens (bg-primary,
// text-muted-foreground, etc.) resolve against — the same tokens all 54
// wireframe templates are built on.
//
// `palette` is the repo's locked-in color choice (see pipeline.js's
// priorPalette/palette resolution and docs/MULTI_AGENT_ORCHESTRATION.md's
// "Color palette" section) — undefined only for call sites that haven't
// been updated to pass one, in which case buildPaletteVars falls back to
// DEFAULT_PALETTE's quiet neutral gray.
function getShellFiles(companyName, palette) {
  const title = companyName ? `${companyName}` : "AI-generated website";
  return {
    "package.json": `{
  "name": "generated-project",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.462.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react-swc": "^3.5.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.11",
    "tailwindcss-animate": "^1.0.7",
    "typescript": "^5.6.2",
    "vite": "^5.4.10"
  }
}
`,
    "index.html": `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    "src/main.tsx": `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
`,
    "src/App.tsx": `import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Services from "@/components/Services";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main>
        <Hero />
        <About />
        <Services />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}
`,
    "src/index.css": buildIndexCssFile(palette),
  };
}

// Fetches one file's current raw content straight from GitHub — used as the
// DeepSeek pipeline's getFileContent for edits (aiChat), since Firestore's
// `files` subcollection isn't guaranteed to hold every section yet (only
// ones a chat edit has touched — createWebsite commits straight to GitHub,
// never to Firestore). Falls back to 'none — new file' the same way a
// brand-new section would, both for an actual 404 and for any transient
// GitHub error — a coder treats both identically (write from scratch)
// rather than the request failing outright over one section's lookup.
async function fetchSectionContentFromGitHub(owner, repo, filePath, githubToken) {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${githubToken}`,
        "Accept": "application/vnd.github.v3.raw",
      },
    });
    if (!res.ok) return "none — new file";
    return await res.text();
  } catch (e) {
    console.error(`fetchSectionContentFromGitHub failed for ${filePath}:`, e);
    return "none — new file";
  }
}

// Loads a user_repos/{repoId} doc and verifies the caller owns it — shared
// by every endpoint added for Vercel publish/SEO/Google/images below
// (requestRepoSync, publishWebsite, seoAudit, google*, generateImage).
// getRepoContents/getRepoTree predate this helper and aren't touched here to
// keep this change scoped — see docs/CODE_REVIEW.md's existing note on them.
// Fixed-window per-user rate limiter — closes the "no rate limiting on
// AI/GitHub-calling functions" gap flagged in docs/MVP_REVIEW_2026-08-14.md.
// One counter doc per (uid, action), reset every `windowMs`. Fixed-window,
// not sliding: a user could in theory burst up to ~2x the limit right at a
// window boundary, which is an acceptable trade for not having to maintain
// a sorted, pruned log of timestamps for something this cheap to get wrong.
async function checkRateLimit(uid, action, { max, windowMs }) {
  const ref = db.collection('rate_limits').doc(`${uid}_${action}`);
  const now = Date.now();
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() : null;
    if (!data || data.windowStart + windowMs <= now) {
      tx.set(ref, { windowStart: now, count: 1 });
      return { allowed: true };
    }
    if (data.count >= max) {
      return { allowed: false, retryAfterMs: data.windowStart + windowMs - now };
    }
    tx.update(ref, { count: admin.firestore.FieldValue.increment(1) });
    return { allowed: true };
  });
}

// Tuned conservatively for a solo-founder-scale product, not measured
// against real usage yet — revisit once there's traffic to look at.
const RATE_LIMITS = {
  createWebsite: { max: 5, windowMs: 60 * 60 * 1000 },        // 5 new sites/hour
  aiChat: { max: 30, windowMs: 60 * 60 * 1000 },               // 30 edits/hour
  generateImage: { max: 15, windowMs: 24 * 60 * 60 * 1000 },   // 15 images/day (on top of the 5-per-project cap)
};

function rateLimitResponse(res, retryAfterMs) {
  const minutes = Math.max(1, Math.ceil(retryAfterMs / 60000));
  return res.status(429).json({ error: `You've hit the rate limit for this action — try again in about ${minutes} minute${minutes === 1 ? '' : 's'}.` });
}

async function resolveOwnedRepo(uid, repoId) {
  const snap = await db.collection('user_repos').doc(repoId).get();
  if (!snap.exists) throw Object.assign(new Error('Project not found'), { httpStatus: 404 });
  const data = snap.data();
  if (data.user_id !== uid) throw Object.assign(new Error('Forbidden'), { httpStatus: 403 });
  return { ref: snap.ref, data };
}

// Same shape/convention as createWebsite's local githubJson (a real .ok
// check + the actual error body on failure, not a silently-trusted
// response) — module-scope here since requestRepoSync/publishWebsite need
// it outside createWebsite's own closure. The two don't collide: JS scoping
// means createWebsite's local `githubJson` shadows this one inside its own
// handler.
async function githubJson(url, options, stepName, githubToken) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`GitHub ${stepName} failed (${res.status}): ${JSON.stringify(body).slice(0, 500)}`);
  }
  return body;
}

// Commits the given files as one new commit on top of the branch's current
// HEAD — unlike createWebsite's very first commit (base_tree: null, since
// that one replaces auto_init's README wholesale), this builds on top of
// whatever's already in the repo, since it's always a follow-up sync of
// real prior content. Used by requestRepoSync and publishWebsite's
// pre-publish flush — see docs/AI_BUILDER_ENGINE.md's write/sync-path split.
async function commitFilesToGithub(repoOwner, repoName, branch, files, message, githubToken) {
  const headRef = await githubJson(
    `https://api.github.com/repos/${repoOwner}/${repoName}/git/refs/heads/${branch}`,
    {}, 'fetch head ref', githubToken
  );
  const headCommitSha = headRef.object.sha;
  const headCommit = await githubJson(
    `https://api.github.com/repos/${repoOwner}/${repoName}/git/commits/${headCommitSha}`,
    {}, 'fetch head commit', githubToken
  );

  const blobs = [];
  for (const file of files) {
    const blob = await githubJson(`https://api.github.com/repos/${repoOwner}/${repoName}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({ content: Buffer.from(file.content).toString('base64'), encoding: 'base64' }),
    }, `blob create (${file.path})`, githubToken);
    blobs.push({ path: file.path, sha: blob.sha, mode: '100644', type: 'blob' });
  }

  const tree = await githubJson(`https://api.github.com/repos/${repoOwner}/${repoName}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({ base_tree: headCommit.tree.sha, tree: blobs }),
  }, 'tree create', githubToken);

  const commit = await githubJson(`https://api.github.com/repos/${repoOwner}/${repoName}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({ message, tree: tree.sha, parents: [headCommitSha] }),
  }, 'commit create', githubToken);

  await githubJson(`https://api.github.com/repos/${repoOwner}/${repoName}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha, force: false }),
  }, 'ref update', githubToken);

  return commit.sha;
}

// Website type detection helper
function detectWebsiteType(message) {
  const msg = message.toLowerCase();

  let type = 'landing';
  if (msg.includes('shop') || msg.includes('store') || msg.includes('ecommerce') || msg.includes('product')) {
    type = 'ecommerce';
  } else if (msg.includes('blog') || msg.includes('post') || msg.includes('article')) {
    type = 'blog';
  } else if (msg.includes('portfolio') || msg.includes('project') || msg.includes('showcase')) {
    type = 'portfolio';
  } else if (msg.includes('saas') || msg.includes('software') || msg.includes('app')) {
    type = 'saas';
  } else if (msg.includes('restaurant') || msg.includes('menu') || msg.includes('food')) {
    type = 'restaurant';
  }

  let style = 'modern';
  if (msg.includes('minimal') || msg.includes('clean')) style = 'minimal';
  if (msg.includes('corporate') || msg.includes('business')) style = 'corporate';
  if (msg.includes('creative') || msg.includes('art')) style = 'creative';

  const features = [];
  if (msg.includes('pricing') || msg.includes('price')) features.push('pricing');
  if (msg.includes('contact') || msg.includes('form')) features.push('contact');
  if (msg.includes('testimonial') || msg.includes('review')) features.push('testimonials');
  if (msg.includes('about')) features.push('about');
  if (msg.includes('team')) features.push('team');

  return { type, style, features };
}

// Generate repository name helper
// Every repo name gets a short random suffix — this used to be the single
// most common cause of "Repository already exists" on createWebsite: the
// `for X` branch below returned a bare name with NO uniqueness guard at
// all (only the generic type-detected fallback added one), so two prompts
// mentioning the same business name (a retry, a second attempt after
// something else failed, or just two different users) collided outright on
// GitHub's per-account unique-name requirement.
function generateRepoName(message, userEmail) {
  const msg = message.toLowerCase();
  // 'for' deliberately excluded as a name trigger — "a website for a
  // bakery", "for my startup" are extremely common phrasings where "for" is
  // a preposition, not a name marker, and grabbing whatever word follows it
  // produced repo names like "a" or "my" for ordinary prompts. "named"/
  // "called" are unambiguous. A stopword + length check is a second safety
  // net for the rare case even those still capture a filler word.
  const nameMatch = msg.match(/(?:named|called)\s+([a-z0-9][a-z0-9-]{1,30})/i);
  const STOPWORDS = new Set(['a', 'an', 'the', 'my', 'our', 'this', 'that', 'it', 'website', 'site', 'page']);

  let base;
  if (nameMatch && nameMatch[1].length >= 3 && !STOPWORDS.has(nameMatch[1])) {
    base = nameMatch[1].replace(/[^a-z0-9-]/g, '-');
  } else {
    base = `${detectWebsiteType(message).type}-website`;
  }

  // Base-36 timestamp tail + a few random chars — short, URL-safe, and
  // collides only astronomically rarely even for two requests in the same
  // millisecond (unlike the old plain-decimal timestamp-slice, which two
  // requests within the same ~1s window could still tie on).
  const suffix = Date.now().toString(36).slice(-6) + Math.random().toString(36).slice(2, 5);
  return `${base}-${suffix}`;
}

// Staff CRM AI assistant. This stays server-side so DEEPSEEK_API_KEY never
// reaches the browser; Firebase callable auth also prevents anonymous use of
// the team's AI budget.
exports.salesAssistant = functions.runWith({ timeoutSeconds: 60, memory: '256MB' }).https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in is required to use the AI assistant.');
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
  if (!apiKey) {
    throw new functions.https.HttpsError('failed-precondition', 'The AI assistant is not configured.');
  }

  const rawMessages = Array.isArray(data?.messages) ? data.messages : [];
  const messages = rawMessages.slice(-12).flatMap((message) => {
    if (!message || (message.role !== 'user' && message.role !== 'assistant') || typeof message.content !== 'string') return [];
    const content = message.content.trim().slice(0, 4000);
    return content ? [{ role: message.role, content }] : [];
  });
  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    throw new functions.https.HttpsError('invalid-argument', 'A user message is required.');
  }

  const lead = data?.lead && typeof data.lead === 'object' ? data.lead : null;
  const leadContext = lead && typeof lead.business === 'string'
    ? `\n\nCurrent lead context: ${JSON.stringify({
      business: lead.business.slice(0, 200),
      industry: typeof lead.industry === 'string' ? lead.industry.slice(0, 120) : '',
      status: typeof lead.status === 'string' ? lead.status.slice(0, 120) : '',
    })}`
    : '';

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.65,
        max_tokens: 900,
        messages: [
          {
            role: 'system',
            content: 'You are EMPIRIAL\'s AI sales assistant for a South African digital-services sales team. Help agents with discovery, objections, calls, follow-ups, proposals, and closing. Be practical, concise, and encouraging. Use South African English and ZAR only when a price is explicitly provided. Never invent pricing, customer facts, completed actions, policies, or guarantees. Give scripts and next steps in clear bullets when useful.' + leadContext,
          },
          ...messages,
        ],
      }),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.error('salesAssistant DeepSeek failure', response.status, detail.slice(0, 300));
      throw new functions.https.HttpsError('internal', 'The AI assistant could not respond right now.');
    }
    const payload = await response.json();
    const reply = payload?.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new functions.https.HttpsError('internal', 'The AI assistant returned an empty response.');
    return { reply };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    console.error('salesAssistant failed', error);
    throw new functions.https.HttpsError('internal', 'The AI assistant could not respond right now.');
  }
});

// Cloud Function: createWebsite
// memory/timeoutSeconds bumped from the 256MB/60s defaults — Step 9 below
// now launches headless Chromium (preview.js) on top of everything else
// this already does (DeepSeek pipeline calls + GitHub API round trips).
exports.createWebsite = functions.runWith({ memory: '1GB', timeoutSeconds: 300 }).https.onRequest((req, res) => {
  cors(req, res, async () => {
    // 1. Validate Auth (Bearer Token)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split('Bearer ')[1];

    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;

    const rateLimit = await checkRateLimit(userId, 'createWebsite', RATE_LIMITS.createWebsite);
    if (!rateLimit.allowed) return rateLimitResponse(res, rateLimit.retryAfterMs);

    // 2. Parse Request
    const { prompt, repoName: providedRepoName, companyName, googlePlaceId } = req.body;

    // 3. Environment Variables
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

    if (!DEEPSEEK_API_KEY || !GITHUB_TOKEN) {
      return res.status(500).json({ error: 'Server configuration error: Missing API Keys' });
    }

    try {
      const detected = detectWebsiteType(prompt);
      let repoName = providedRepoName || generateRepoName(prompt, userEmail);

      // Step 4: Create GitHub Repo. Retried on a real name collision (422)
      // only when the name was auto-generated (never for a caller-provided
      // repoName — silently renaming a name someone explicitly asked for
      // would be surprising). generateRepoName's random suffix already
      // makes this astronomically rare; this is the belt-and-suspenders
      // second layer, not the primary fix.
      let createRepoResponse;
      let repoData;
      const maxAttempts = providedRepoName ? 1 : 3;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`Creating repository (attempt ${attempt}/${maxAttempts}): ${repoName}`);
        createRepoResponse = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: repoName,
            description: `AI-generated ${detected.type} website`,
            private: false,
            // true, not false: GitHub's Git Data API (blob/tree/commit create,
            // used in Step 7 below) rejects blob creation with 409 "Git
            // Repository is empty" on a repo with zero commits — discovered
            // when an 18-file generation hit exactly that. auto_init gives the
            // repo one initial commit (a README) so the Git Data API has
            // something to build on; Step 7's tree uses base_tree: null so
            // that README is discarded entirely from our actual commit, not
            // merged into it.
            auto_init: true,
          }),
        });

        if (createRepoResponse.ok) {
          repoData = await createRepoResponse.json();
          break;
        }

        if (createRepoResponse.status === 422 && attempt < maxAttempts) {
          repoName = generateRepoName(prompt, userEmail); // fresh suffix, try again
          continue;
        }

        if (createRepoResponse.status === 422) {
          return res.status(400).json({ error: `Repository "${repoName}" already exists.` });
        }
        const errorData = await createRepoResponse.text();
        return res.status(500).json({ error: `Failed to create repository: ${errorData}` });
      }

      const repoOwner = repoData.owner.login;
      const defaultBranch = repoData.default_branch || 'main';

      // Real reviews for testimonials (see agents/coders/base.js's
      // applyRealReviews) — best-effort: googlePlaceId is caller-supplied
      // and optional (from findGooglePlace below), and a Places lookup
      // failure should never block the whole build. Falls back to the
      // pipeline's usual invented testimonials when absent or < 3 reviews.
      let realReviews;
      if (googlePlaceId) {
        try {
          const placeData = await getPlaceReviews(googlePlaceId);
          realReviews = placeData.reviews;
        } catch (placesError) {
          console.error('createWebsite: getPlaceReviews failed, continuing with invented testimonials:', placesError);
        }
      }

      // Step 5: Generate Code — the DeepSeek multi-agent pipeline (see
      // docs/MULTI_AGENT_ORCHESTRATION.md). Replaces the old single
      // OpenRouter call: that free-tier model's 50-requests/day account-wide
      // cap made real usage impossible, and this pipeline was already built
      // to solve it but had never been wired into this function. 'create'
      // always means all 6 sections (nav/hero/about/services/testimonials/
      // footer), enforced inside goalSetter regardless of what the model
      // returns. getFileContent is a fresh-build no-op — a create never has
      // prior content for a coder to revise.
      const pipelineResult = await runPipeline({
        intent: 'create',
        rawInput: prompt,
        apiKey: DEEPSEEK_API_KEY,
        model: DEEPSEEK_MODEL,
        realReviews,
        getFileContent: async () => 'none — new file',
      });

      // Step 6: Assemble files — static config (BASE_FILES) + the
      // deterministic app shell (getShellFiles: package.json, index.html,
      // main.tsx, App.tsx, index.css — never AI-generated, see its own
      // comment) + the 6 section components the pipeline just produced.
      const files = [];
      for (const [path, content] of Object.entries(BASE_FILES)) {
        files.push({ path, content });
      }
      for (const [path, content] of Object.entries(getShellFiles(companyName, pipelineResult.palette))) {
        files.push({ path, content });
      }
      for (const f of pipelineResult.files) {
        files.push({ path: f.path, content: f.content });
      }

      // Step 6a: SEO — PDF sections 8-13. Built from what's already known
      // (no extra AI call); domain stays unknown until Vercel publish
      // assigns one, so canonical/sitemap URLs are empty until then — see
      // seo/manifest.js's own comment on why that's honest, not a bug.
      const seoManifest = buildSeoManifest({ companyName, prompt, detected });
      const indexHtmlFile = files.find((f) => f.path === 'index.html');
      if (indexHtmlFile) {
        indexHtmlFile.content = injectHeadTags(indexHtmlFile.content, seoManifest.pages[0], seoManifest, {
          structuredDataScript: buildStructuredDataScript(seoManifest),
        });
      }
      files.push({ path: 'sitemap.xml', content: buildSitemap(seoManifest) });
      files.push({ path: 'robots.txt', content: buildRobotsTxt(seoManifest) });

      // Step 6b: Compile Tailwind to static CSS — see compileTailwindCss's
      // own comment for why this has to happen server-side. Best-effort: a
      // compile failure (e.g. a stray syntax error in AI-generated code
      // confusing the JIT scanner) shouldn't fail the whole generation —
      // worse case is the same raw @tailwind-directives behavior this
      // replaces, not a broken request.
      try {
        await compileTailwindCss(files);
      } catch (cssError) {
        console.error("Tailwind compile failed, shipping uncompiled CSS:", cssError);
      }

      // Step 7: Commit to GitHub. Every call here previously went unchecked
      // (no .ok check, response just parsed and trusted) — a failure at any
      // point (rate limit, a malformed blob, GitHub API hiccup) meant the
      // rest of the chain ran on garbage (e.g. tree entries with sha:
      // undefined) and createWebsite still returned 200 with an empty repo,
      // discovered when an 18-file generation hit exactly that. Every step
      // now throws with the real GitHub error body on failure instead of
      // silently continuing.
      async function githubJson(url, options, stepName) {
        const res = await fetch(url, options);
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(`GitHub ${stepName} failed (${res.status}): ${JSON.stringify(body).slice(0, 500)}`);
        }
        return body;
      }

      const githubHeaders = {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      };

      // auto_init's initial commit can take a moment to actually exist after
      // repo creation returns (eventual consistency) — a couple of retries
      // is cheap insurance against a 404 here on a fast follow-up call.
      let initialCommitSha;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const ref = await githubJson(
            `https://api.github.com/repos/${repoOwner}/${repoName}/git/refs/heads/${defaultBranch}`,
            { headers: githubHeaders },
            'fetch initial ref'
          );
          initialCommitSha = ref.object.sha;
          break;
        } catch (e) {
          if (attempt === 2) throw e;
          await new Promise((r) => setTimeout(r, 1000));
        }
      }

      const blobs = [];
      for (const file of files) {
        const blob = await githubJson(`https://api.github.com/repos/${repoOwner}/${repoName}/git/blobs`, {
          method: 'POST',
          headers: githubHeaders,
          body: JSON.stringify({
            content: Buffer.from(file.content).toString('base64'),
            encoding: 'base64',
          }),
        }, `blob create (${file.path})`);
        blobs.push({ path: file.path, sha: blob.sha, mode: '100644', type: 'blob' });
      }

      const tree = await githubJson(`https://api.github.com/repos/${repoOwner}/${repoName}/git/trees`, {
        method: 'POST',
        headers: githubHeaders,
        body: JSON.stringify({ base_tree: null, tree: blobs }),
      }, 'tree create');

      const commit = await githubJson(`https://api.github.com/repos/${repoOwner}/${repoName}/git/commits`, {
        method: 'POST',
        headers: githubHeaders,
        body: JSON.stringify({
          message: 'Initial commit: AI-generated website',
          tree: tree.sha,
          // Child of auto_init's README commit, not a parentless root commit
          // — keeps this a normal, single-history branch.
          parents: [initialCommitSha],
        }),
      }, 'commit create');

      // PATCH, not POST: auto_init means refs/heads/<defaultBranch> already
      // exists (pointing at the README commit) — PATCH moves it to ours.
      // force: true since our tree (base_tree: null, above) doesn't
      // fast-forward from the README commit, it replaces it outright.
      await githubJson(`https://api.github.com/repos/${repoOwner}/${repoName}/git/refs/heads/${defaultBranch}`, {
        method: 'PATCH',
        headers: githubHeaders,
        body: JSON.stringify({ sha: commit.sha, force: true }),
      }, 'ref update');

      // Step 8: Save to Firestore — section_manifest is what lets aiChat's
      // later edits reuse each section's wireframe instead of rerolling it
      // (see docs/MULTI_AGENT_ORCHESTRATION.md's "section manifest").
      const repoId = `${userId}_${repoName}`;
      await db.collection('user_repos').doc(repoId).set({
        user_id: userId,
        repo_owner: repoOwner,
        repo_name: repoName,
        repo_url: repoData.html_url,
        deploy_url: `https://${repoName}.netlify.app`, // Assumption for now
        created_at: new Date().toISOString(),
        template_type: detected.type,
        generation_prompt: prompt,
        section_manifest: pipelineResult.newSectionManifest,
        style: pipelineResult.style,
        palette: pipelineResult.palette,
        google_place_id: googlePlaceId || null,
        seo_manifest: seoManifest,
        seo_status: 'GENERATED',
        vercel_deployment_status: 'NOT_CONNECTED',
      });

      // Step 9: Real hero-section preview screenshot — best effort, same as
      // Step 6b's Tailwind compile: a failure here (a rendering edge case,
      // Chromium hiccup, etc.) shouldn't fail the whole generation, just
      // leave this project without a thumbnail until the next save retries it.
      try {
        await captureRepoPreview(repoId, userId, files);
      } catch (previewError) {
        console.error('captureRepoPreview failed for', repoId, previewError);
      }

      return res.status(200).json({
        success: true,
        repo: {
          name: repoName,
          url: repoData.html_url,
          files_created: files.length,
          failed_sections: pipelineResult.failedSections,
        }
      });

    } catch (error) {
      console.error('Error in createWebsite:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

// Cloud Function: getRepoContents
exports.getRepoContents = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Verify token
      const token = authHeader.split('Bearer ')[1];
      await admin.auth().verifyIdToken(token);

      const { owner, repo, path: filePath } = req.body;
      const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

      if (!GITHUB_TOKEN) {
        return res.status(500).json({ error: 'Server configuration error' });
      }

      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath || ''}`;
      const githubRes = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!githubRes.ok) {
        throw new Error('Failed to fetch from GitHub');
      }

      const data = await githubRes.json();
      return res.status(200).json(data);

    } catch (error) {
      console.error('Error in getRepoContents:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

// Cloud Function: aiChat
exports.aiChat = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let streamStarted = false;
    try {
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      const userId = decodedToken.uid;

      const rateLimit = await checkRateLimit(userId, 'aiChat', RATE_LIMITS.aiChat);
      if (!rateLimit.allowed) return rateLimitResponse(res, rateLimit.retryAfterMs);

      const { messages, repoOwner, repoName } = req.body;
      const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
      const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
      const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

      if (!DEEPSEEK_API_KEY || !GITHUB_TOKEN) return res.status(500).json({ error: 'Missing API Key' });
      if (!repoOwner || !repoName) return res.status(400).json({ error: 'Missing repoOwner/repoName' });

      const rawInput = messages?.length ? messages[messages.length - 1]?.content || '' : '';

      // repoId mirrors createWebsite's scheme exactly (${userId}_${repoName})
      // — the repo doc this edit's section_manifest lives on and gets
      // written back to. Best-effort read: an older repo created before
      // this field existed just means sectionManifest is undefined, which
      // the pipeline already treats as "every affected section is new."
      const repoId = `${userId}_${repoName}`;
      let sectionManifest;
      let priorStyle;
      let priorPalette;
      let googlePlaceId;
      try {
        const repoDoc = await db.collection('user_repos').doc(repoId).get();
        sectionManifest = repoDoc.exists ? repoDoc.data().section_manifest : undefined;
        // Style and palette are both decided once at creation and carried
        // forward on every edit (see pipeline.js's priorStyle/priorPalette)
        // — a repo created before these fields existed just falls back to
        // 'default'/DEFAULT_PALETTE inside the pipeline.
        priorStyle = repoDoc.exists ? repoDoc.data().style : undefined;
        priorPalette = repoDoc.exists ? repoDoc.data().palette : undefined;
        googlePlaceId = repoDoc.exists ? repoDoc.data().google_place_id : undefined;
      } catch (manifestReadError) {
        console.error('aiChat: failed to read section_manifest, continuing without it:', manifestReadError);
      }

      // Same best-effort real-reviews lookup as createWebsite — cheap
      // enough to just always fetch when a place is linked rather than
      // trying to predict whether this edit will touch testimonials.
      let realReviews;
      if (googlePlaceId) {
        try {
          const placeData = await getPlaceReviews(googlePlaceId);
          realReviews = placeData.reviews;
        } catch (placesError) {
          console.error('aiChat: getPlaceReviews failed, continuing with invented testimonials:', placesError);
        }
      }

      // SSE-shaped output — matches OpenRouter's wire format exactly (see
      // src/features/builder/lib/aiChat.ts's streamAiChat) so the existing
      // frontend parsing needs no changes even though nothing is actually
      // proxied from a provider anymore: the pipeline's own onProgress
      // chunks (plain text + <file> blocks, see agents/shared.js's
      // buildFileBlock) get wrapped in the same `data: {...}` envelope.
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      const sendChunk = (chunk) => {
        streamStarted = true;
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n\n`);
      };

      const pipelineResult = await runPipeline({
        intent: 'edit',
        rawInput,
        apiKey: DEEPSEEK_API_KEY,
        model: DEEPSEEK_MODEL,
        sectionManifest,
        priorStyle,
        priorPalette,
        realReviews,
        getFileContent: (section) => fetchSectionContentFromGitHub(repoOwner, repoName, SECTION_FILES[section], GITHUB_TOKEN),
        onProgress: sendChunk,
      });

      // Best-effort: persist the updated manifest so the next edit reuses
      // these wireframes instead of rerolling them. Doesn't block/fail the
      // response the user is already watching stream in. Also fires on a
      // pure recolor (zero affected sections, palette changed) — otherwise
      // the new palette would never make it past this turn's stream.
      if (pipelineResult.affectedSections.length > 0 || pipelineResult.recolored) {
        try {
          await db.collection('user_repos').doc(repoId).set(
            { section_manifest: pipelineResult.newSectionManifest, style: pipelineResult.style, palette: pipelineResult.palette, last_updated: new Date().toISOString() },
            { merge: true }
          );
        } catch (manifestWriteError) {
          console.error('aiChat: failed to persist section_manifest:', manifestWriteError);
        }
      }

      res.end();
    } catch (error) {
      console.error('Error in aiChat:', error);
      if (streamStarted) {
        // Headers are already sent — surface the failure inside the stream
        // itself (parsed the same as any other chunk) rather than trying to
        // change the response status this late.
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: `\n\n[Note: something went wrong — ${error.message}]` } }] })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });
});

// Cloud Function: getRepoTree (for Sandpack)
exports.getRepoTree = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const token = authHeader.split('Bearer ')[1];
      await admin.auth().verifyIdToken(token);

      const { owner, repo } = req.body;
      const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

      if (!GITHUB_TOKEN) return res.status(500).json({ error: 'Missing API Key' });

      // 1. Get default branch (usually main)
      const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` }
      });
      if (!repoRes.ok) throw new Error('Failed to fetch repo info');
      const repoData = await repoRes.json();
      const defaultBranch = repoData.default_branch || 'main';

      // 2. Get the recursive tree
      const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`, {
        headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` }
      });
      if (!treeRes.ok) throw new Error('Failed to fetch git tree');
      const treeData = await treeRes.json();

      if (!treeData.tree) {
        return res.status(500).json({ error: 'Failed to fetch tree structure' });
      }

      // 3. Filter for blobs (files) and fetch content
      const blobs = treeData.tree.filter(node => node.type === 'blob');

      // Limit to specific extensions and reasonable count
      const textExtensions = ['.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.json', '.md'];
      const fileBlobs = blobs.filter(blob => {
        return textExtensions.some(ext => blob.path.endsWith(ext)) &&
          !blob.path.includes('package-lock.json') &&
          !blob.path.includes('yarn.lock') &&
          !blob.path.includes('dist/');
      }).slice(0, 50);

      const files = {};

      // Parallel fetch for speed
      await Promise.all(fileBlobs.map(async (blob) => {
        try {
          const contentRes = await fetch(blob.url, {
            headers: {
              'Authorization': `Bearer ${GITHUB_TOKEN}`,
              'Accept': 'application/vnd.github.v3.raw'
            }
          });
          if (contentRes.ok) {
            const text = await contentRes.text();
            // Store with leading slash for Sandpack if needed, usually just path is fine
            // Sandpack expects paths like "/src/App.js"
            const path = blob.path.startsWith('/') ? blob.path : '/' + blob.path;
            files[path] = { code: text };
          }
        } catch (e) {
          console.error(`Failed to fetch ${blob.path}`, e);
        }
      }));

      // Static mocks for package.json if missing (fixes "module not found" in Sandpack defaults)
      if (!files['/package.json']) {
        files['/package.json'] = {
          code: JSON.stringify({
            name: "generated-project",
            main: "/index.html",
            dependencies: { "react": "^18.0.0", "react-dom": "^18.0.0", "lucide-react": "latest", "clsx": "latest", "tailwind-merge": "latest" },
            devDependencies: { "vite": "latest" }
          }, null, 2)
        };
      }

      return res.status(200).json({ files });

    } catch (error) {
      console.error('Error in getRepoTree:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

// --- REPO PREVIEW (real hero-section screenshot) ---
// Regenerates a project's My Projects thumbnail from its current saved
// files — see preview.js. createWebsite calls captureRepoPreview directly
// (it already has the files in memory); this is the endpoint the client
// calls after a manual save, where it doesn't.
exports.regenerateRepoPreview = functions.runWith({ memory: '1GB', timeoutSeconds: 120 }).https.onRequest((req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { repoId } = req.body;
    if (!repoId) return res.status(400).json({ error: 'repoId is required' });

    try {
      const repoSnap = await db.collection('user_repos').doc(repoId).get();
      if (!repoSnap.exists) return res.status(404).json({ error: 'Repo not found' });
      if (repoSnap.data().user_id !== decodedToken.uid) {
        return res.status(403).json({ error: 'You do not own this project' });
      }

      const previewUrl = await regeneratePreviewFromFirestore(repoId);
      return res.status(200).json({ success: true, preview_image_url: previewUrl });
    } catch (error) {
      console.error('Error in regenerateRepoPreview:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

// --- LINK PREVIEW (SEO metadata) ---
// Pulls Open Graph / meta tags + favicon off a public URL so the portfolio
// coverflow cards on the marketing site can show each project's real title,
// description, and site icon instead of only the hand-curated copy. No auth
// required — this only ever reads pages that are already public, and it's
// called from the public marketing site itself.

/**
 * Pulls a meta tag's `content` by `property` or `name`, regardless of
 * attribute order (some sites emit content= before property=/name=).
 * @param {string} html
 * @param {string} key e.g. "og:title"
 * @return {string|null}
 */
function extractMetaContent(html, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const attrFirst = new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']*)["']`, 'i');
  const contentFirst = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${escaped}["']`, 'i');
  const match = html.match(attrFirst) || html.match(contentFirst);
  return match ? match[1].trim() : null;
}

/**
 * Pulls a <link rel="icon"|"shortcut icon"|"apple-touch-icon"> href,
 * regardless of attribute order.
 * @param {string} html
 * @return {string|null}
 */
function extractFaviconHref(html) {
  const relFirst = /<link[^>]+rel=["'](?:shortcut icon|icon|apple-touch-icon)["'][^>]*href=["']([^"']+)["']/i;
  const hrefFirst = /<link[^>]+href=["']([^"']+)["'][^>]*rel=["'](?:shortcut icon|icon|apple-touch-icon)["']/i;
  const match = html.match(relFirst) || html.match(hrefFirst);
  return match ? match[1].trim() : null;
}

const LINK_PREVIEW_CACHE_MS = 14 * 24 * 60 * 60 * 1000; // 14 days — this is marketing copy, not live data

exports.fetchLinkPreview = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const targetUrl = req.query.url;
    if (!targetUrl || typeof targetUrl !== 'string' || !/^https?:\/\//i.test(targetUrl)) {
      return res.status(400).json({ error: 'A valid ?url= query param is required' });
    }

    // Cache by URL so 24 portfolio cards don't re-scrape their target sites
    // on every page load — Firestore doc IDs can't contain "/", hence base64.
    const cacheId = Buffer.from(targetUrl).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 200);
    const cacheRef = db.collection('link_previews').doc(cacheId);

    try {
      const cached = await cacheRef.get();
      if (cached.exists && Date.now() - (cached.data().fetched_at || 0) < LINK_PREVIEW_CACHE_MS) {
        return res.status(200).json(cached.data().preview);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      let pageRes;
      try {
        pageRes = await fetch(targetUrl, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EmpirialLinkPreview/1.0; +https://empirialdesigns.co.za)' },
        });
      } finally {
        clearTimeout(timeoutId);
      }
      if (!pageRes.ok) throw new Error(`Target site responded ${pageRes.status}`);
      const html = await pageRes.text();

      const title = extractMetaContent(html, 'og:title') || extractMetaContent(html, 'twitter:title')
        || (html.match(/<title>([^<]*)<\/title>/i) || [])[1]?.trim() || null;
      const description = extractMetaContent(html, 'og:description') || extractMetaContent(html, 'description')
        || extractMetaContent(html, 'twitter:description') || null;
      const rawImage = extractMetaContent(html, 'og:image') || extractMetaContent(html, 'twitter:image');
      const rawFavicon = extractFaviconHref(html);

      const base = new URL(targetUrl);
      const resolve = (href) => { try { return new URL(href, base).toString(); } catch { return null; } };
      const preview = {
        title,
        description,
        image: rawImage ? resolve(rawImage) : null,
        favicon: rawFavicon ? resolve(rawFavicon) : `${base.origin}/favicon.ico`,
      };

      await cacheRef.set({ url: targetUrl, preview, fetched_at: Date.now() });
      return res.status(200).json(preview);
    } catch (error) {
      console.error('fetchLinkPreview failed for', targetUrl, error);
      // 200 with nulls, not 500 — the caller (portfolio cards) treats a
      // failed preview as "keep the curated fallback copy", not an error state.
      return res.status(200).json({ title: null, description: null, image: null, favicon: null });
    }
  });
});

// ---------------------------------------------------------------------
// Vercel publish — PDF sections 6 & 36 (Sprint 1)
// ---------------------------------------------------------------------

// setThemeColor — a deterministic color change with zero LLM calls. Color
// was previously only reachable through 3 model calls (Request Taker ->
// Goal Setter's `recolor` classification), which could — and did — silently
// misclassify a plain "change the colour" as not a color request at all,
// producing no visible change. buildIndexCssFile is a pure function; there
// is nothing here for a model to get wrong. The builder UI's theme swatches
// call this directly instead of routing a color change through chat.
exports.setThemeColor = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decodedToken = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
      const { repoId, baseHue, accentHue, accentSaturation } = req.body;
      const { ref } = await resolveOwnedRepo(decodedToken.uid, repoId);

      const palette = {
        baseHue: clampHue(baseHue),
        accentHue: clampHue(accentHue),
        accentSaturation: clampSaturation(accentSaturation),
      };
      const content = buildIndexCssFile(palette);

      await ref.collection('files').doc(encodeURIComponent('src/index.css')).set({
        path: 'src/index.css',
        content,
        updated_at: new Date().toISOString(),
      });
      await ref.set({ palette, last_updated: new Date().toISOString() }, { merge: true });

      return res.status(200).json({ success: true, path: 'src/index.css', content, palette });
    } catch (error) {
      console.error('Error in setThemeColor:', error);
      return res.status(error.httpStatus || 500).json({ error: error.message });
    }
  });
});

// Explicit-flush GitHub sync: reads the current `files` subcollection and
// commits it to GitHub. This is the piece docs/AI_BUILDER_ENGINE.md
// describes (onRepoFileWrite trigger + scheduled sweep) that was never
// actually implemented in this file — SaveButton.tsx has been calling this
// endpoint by name since before it existed, silently 404ing and falling
// back to "will retry on the next scheduled sweep" (which also doesn't
// exist). This is the real implementation of the explicit-Save half of that
// design; the trigger/sweep half stays a known gap — publishWebsite below
// always force-syncs first specifically because that gap means GitHub can
// otherwise be arbitrarily stale.
exports.requestRepoSync = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decodedToken = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
      const { repoId } = req.body;
      if (!repoId) return res.status(400).json({ error: 'Missing repoId' });

      const { ref, data: repo } = await resolveOwnedRepo(decodedToken.uid, repoId);
      if (!repo.repo_url || !repo.repo_owner || !repo.repo_name) {
        // Not GitHub-backed yet (e.g. a createRepoFromPrompt placeholder
        // project) — nothing to sync to, not an error.
        return res.status(200).json({ success: true, synced: false, reason: 'not GitHub-backed yet' });
      }

      const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
      if (!GITHUB_TOKEN) return res.status(500).json({ error: 'Server configuration error' });

      const filesSnap = await db.collection('user_repos').doc(repoId).collection('files').get();
      if (filesSnap.empty) return res.status(200).json({ success: true, synced: false, reason: 'no cached edits to sync' });

      const files = filesSnap.docs
        .map((d) => ({ path: d.data().path, content: d.data().content }))
        .filter((f) => f.path && f.content !== undefined);

      const branch = process.env.VERCEL_PRODUCTION_BRANCH || 'main';
      const commitSha = await commitFilesToGithub(repo.repo_owner, repo.repo_name, branch, files, 'Sync AI edits to GitHub', GITHUB_TOKEN);

      await ref.set({
        github_sync_status: 'clean',
        pending_edit_count: 0,
        last_synced_at: new Date().toISOString(),
        last_commit_sha: commitSha,
      }, { merge: true });

      return res.status(200).json({ success: true, synced: true, commitSha });
    } catch (error) {
      console.error('Error in requestRepoSync:', error);
      return res.status(error.httpStatus || 500).json({ error: error.message });
    }
  });
});

// publishWebsite — PDF section 6.6/6.9. Flushes any pending Firestore edits
// (and a pending Google verification tag, if one's waiting — see
// googleVerify below) to GitHub, then ensures a Vercel project exists and
// triggers a production deployment. Runs at 120s: publish is user-triggered
// and rare, not on the hot path createWebsite/aiChat are.
exports.publishWebsite = functions.runWith({ timeoutSeconds: 120, memory: '256MB' }).https.onRequest((req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decodedToken = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
      const { repoId } = req.body;
      if (!repoId) return res.status(400).json({ error: 'Missing repoId' });

      const { ref, data: repo } = await resolveOwnedRepo(decodedToken.uid, repoId);
      if (!repo.repo_url || !repo.repo_owner || !repo.repo_name) {
        return res.status(400).json({ error: 'This project has no GitHub repository to publish yet.' });
      }
      if (!process.env.VERCEL_TOKEN) {
        return res.status(501).json({ error: 'Publishing is not configured yet — VERCEL_TOKEN is missing.' });
      }
      const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
      if (!GITHUB_TOKEN) return res.status(500).json({ error: 'Server configuration error' });

      await ref.set({ vercel_deployment_status: 'BUILDING' }, { merge: true });

      // Step 1: flush Firestore's current file cache to GitHub, plus a
      // pending Google verification tag if googleVerify's "get-token" step
      // has run but this repo hasn't been published since.
      const filesSnap = await db.collection('user_repos').doc(repoId).collection('files').get();
      const filesByPath = {};
      filesSnap.docs.forEach((d) => {
        const data = d.data();
        if (data.path && data.content !== undefined) filesByPath[data.path] = data.content;
      });

      if (repo.google_verification_token) {
        const currentIndexHtml = filesByPath['index.html']
          || await fetchSectionContentFromGitHub(repo.repo_owner, repo.repo_name, 'index.html', GITHUB_TOKEN);
        if (currentIndexHtml && currentIndexHtml !== 'none — new file' && !currentIndexHtml.includes(repo.google_verification_token)) {
          filesByPath['index.html'] = currentIndexHtml.replace(
            '</head>',
            `    ${renderVerificationTag(repo.google_verification_token)}\n  </head>`
          );
        }
      }

      const filesToCommit = Object.entries(filesByPath).map(([path, content]) => ({ path, content }));
      if (filesToCommit.length > 0) {
        const branch = process.env.VERCEL_PRODUCTION_BRANCH || 'main';
        try {
          await commitFilesToGithub(repo.repo_owner, repo.repo_name, branch, filesToCommit, 'Sync before publish', GITHUB_TOKEN);
        } catch (syncError) {
          // A no-op commit (nothing actually changed since the last sync)
          // can 422 on some GitHub edge cases — don't fail the whole
          // publish over that; only a real failure below should.
          console.warn('publishWebsite: pre-publish sync failed non-fatally (may just mean nothing changed):', syncError.message);
        }
      }

      // Step 2/3: ensure the Vercel project exists, trigger a production
      // deployment, and give it a short window to finish before returning —
      // PDF section 6.6, steps 9-14.
      const projectName = repo.repo_name.replace(/[^a-z0-9-]/gi, '-').toLowerCase().slice(0, 52);
      const project = await ensureVercelProject(projectName, repo.repo_owner, repo.repo_name);
      const deployment = await createProductionDeployment(project, repo.repo_owner, repo.repo_name, GITHUB_TOKEN);
      const finalDeployment = await pollDeployment(deployment.id);

      const status = mapReadyState(finalDeployment.readyState);
      const productionUrl = finalDeployment.url ? `https://${finalDeployment.url}` : undefined;

      await ref.set({
        vercel_project_id: project.id,
        vercel_project_name: project.name,
        vercel_deployment_id: finalDeployment.id,
        vercel_deployment_status: status,
        vercel_production_url: status === 'READY' ? productionUrl : (repo.vercel_production_url || null),
        last_published_at: new Date().toISOString(),
      }, { merge: true });

      return res.status(200).json({ success: true, status, url: productionUrl, deploymentId: finalDeployment.id });
    } catch (error) {
      console.error('Error in publishWebsite:', error);
      return res.status(error.httpStatus || 500).json({ error: error.message });
    }
  });
});

// getDeploymentStatus — lets the frontend keep polling after publishWebsite
// returns BUILDING (its own poll window is short, 45s, to stay well under
// this function's own timeout). GET ?repoId=... or POST { repoId }.
exports.getDeploymentStatus = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decodedToken = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
      const repoId = req.query.repoId || (req.body && req.body.repoId);
      if (!repoId) return res.status(400).json({ error: 'Missing repoId' });
      const { data: repo } = await resolveOwnedRepo(decodedToken.uid, repoId);

      if (!repo.vercel_deployment_id) {
        return res.status(200).json({ status: repo.vercel_deployment_status || 'NOT_CONNECTED' });
      }
      const deployment = await getDeployment(repo.vercel_deployment_id);
      const status = mapReadyState(deployment.readyState);
      const productionUrl = deployment.url ? `https://${deployment.url}` : repo.vercel_production_url;

      if (status !== repo.vercel_deployment_status) {
        await db.collection('user_repos').doc(repoId).set({
          vercel_deployment_status: status,
          vercel_production_url: status === 'READY' ? productionUrl : repo.vercel_production_url,
        }, { merge: true });
      }

      return res.status(200).json({ status, url: productionUrl });
    } catch (error) {
      console.error('Error in getDeploymentStatus:', error);
      return res.status(error.httpStatus || 500).json({ error: error.message });
    }
  });
});

// ---------------------------------------------------------------------
// SEO audit — PDF section 13 (Sprint 2)
// ---------------------------------------------------------------------

exports.seoAudit = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decodedToken = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
      const { repoId } = req.body;
      if (!repoId) return res.status(400).json({ error: 'Missing repoId' });
      const { data: repo } = await resolveOwnedRepo(decodedToken.uid, repoId);
      if (!repo.repo_owner || !repo.repo_name) return res.status(400).json({ error: 'This project has no GitHub repository yet.' });

      const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
      const paths = ['index.html', 'sitemap.xml', 'robots.txt', ...Object.values(SECTION_FILES)];
      const files = {};
      for (const p of paths) {
        const content = await fetchSectionContentFromGitHub(repo.repo_owner, repo.repo_name, p, GITHUB_TOKEN);
        if (content && content !== 'none — new file') files[p] = content;
      }

      const result = auditFiles(files);
      await db.collection('user_repos').doc(repoId).set({ seo_audit: result, seo_audit_at: new Date().toISOString() }, { merge: true });
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in seoAudit:', error);
      return res.status(error.httpStatus || 500).json({ error: error.message });
    }
  });
});

// ---------------------------------------------------------------------
// Google Search Console — PDF sections 14-23 (Sprint 3)
// ---------------------------------------------------------------------

// Returns an authorization URL rather than redirecting directly: this
// endpoint is Bearer-token-gated (a plain browser navigation can't carry an
// Authorization header), so the frontend calls this first, then does
// window.location = url itself. A one-time oauth_states/{id} doc (not a
// bare uid-in-state) is what makes googleCallback below trustworthy without
// requiring a second auth mechanism on a request that arrives with no
// Authorization header at all — Google's own redirect.
exports.googleConnect = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decodedToken = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
      if (!process.env.GOOGLE_CLIENT_ID) return res.status(501).json({ error: 'Google Search Console is not configured yet.' });

      const repoId = req.query.repoId || null;
      const stateId = require('crypto').randomBytes(16).toString('hex');
      await db.collection('oauth_states').doc(stateId).set({
        uid: decodedToken.uid,
        repoId,
        created_at: new Date().toISOString(),
      });

      return res.status(200).json({ url: buildAuthUrl(stateId) });
    } catch (error) {
      console.error('Error in googleConnect:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

// Hit directly by Google's redirect — no Authorization header available,
// which is exactly why googleConnect above stores a one-time state doc
// instead of trusting an unsigned uid round-tripped through `state`.
exports.googleCallback = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const appUrl = process.env.APP_URL || 'https://empirialdesigns.web.app';
    try {
      const { code, state, error: oauthError } = req.query;
      if (oauthError) return res.redirect(`${appUrl}/dashboard?google=denied`);
      if (!code || !state) return res.status(400).send('Missing code/state');

      const stateSnap = await db.collection('oauth_states').doc(String(state)).get();
      if (!stateSnap.exists) return res.status(400).send('Invalid or expired connection request — please try again.');
      const { uid, repoId } = stateSnap.data();
      await stateSnap.ref.delete(); // one-time use

      const tokens = await exchangeCodeForTokens(code);
      const integrationUpdate = {
        accessToken: tokens.access_token,
        expiryDate: Date.now() + tokens.expires_in * 1000,
        scopes: (tokens.scope || '').split(' '),
        updatedAt: new Date().toISOString(),
      };
      // Google only returns a refresh_token on first consent — never
      // overwrite an existing one with a missing value on a later reconnect.
      if (tokens.refresh_token) integrationUpdate.refreshToken = tokens.refresh_token;
      await db.collection('google_integrations').doc(uid).set(integrationUpdate, { merge: true });

      if (repoId) {
        await db.collection('user_repos').doc(repoId).set({ seo_status: 'GOOGLE_CONNECTED' }, { merge: true });
        return res.redirect(`${appUrl}/dashboard/seo/${repoId}?google=connected`);
      }
      return res.redirect(`${appUrl}/dashboard?google=connected`);
    } catch (error) {
      console.error('Error in googleCallback:', error);
      return res.status(500).send('Google connection failed: ' + error.message);
    }
  });
});

// googleVerify — two-step, matching PDF section 18's actual flow: step
// 'get-token' fetches the META token and stores it (publishWebsite then
// embeds+commits it on the next publish); step 'confirm' asks Google to
// check it's actually live and records the property. Split into two calls
// rather than one because the tag has to survive a real redeploy in
// between — there's no way to verify before that's happened.
exports.googleVerify = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decodedToken = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
      const { repoId, step } = req.body;
      const { ref, data: repo } = await resolveOwnedRepo(decodedToken.uid, repoId);

      const integrationSnap = await db.collection('google_integrations').doc(decodedToken.uid).get();
      if (!integrationSnap.exists) return res.status(400).json({ error: 'Connect Google Search first.' });
      const accessToken = await getValidAccessToken(db, decodedToken.uid, integrationSnap.data());

      if (!repo.vercel_production_url) {
        return res.status(400).json({ error: 'Publish the site to Vercel before connecting Google Search.' });
      }
      const siteUrl = repo.vercel_production_url.endsWith('/') ? repo.vercel_production_url : repo.vercel_production_url + '/';

      if (step === 'get-token') {
        const token = await getVerificationToken(accessToken, siteUrl);
        await ref.set({ google_verification_token: token, google_search_console_property: siteUrl, seo_status: 'VERIFICATION_PENDING' }, { merge: true });
        return res.status(200).json({
          token,
          instructions: 'Click Publish again so the verification tag actually goes live, then call this with step: "confirm".',
        });
      }

      if (step === 'confirm') {
        await verifySite(accessToken, siteUrl);
        await addSite(accessToken, siteUrl);
        await ref.set({ seo_status: 'VERIFIED' }, { merge: true });
        return res.status(200).json({ success: true, siteUrl });
      }

      return res.status(400).json({ error: 'step must be "get-token" or "confirm"' });
    } catch (error) {
      console.error('Error in googleVerify:', error);
      return res.status(error.httpStatus || 500).json({ error: error.message });
    }
  });
});

exports.googleSubmitSitemap = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decodedToken = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
      const { repoId } = req.body;
      const { ref, data: repo } = await resolveOwnedRepo(decodedToken.uid, repoId);
      if (repo.seo_status !== 'VERIFIED' && repo.seo_status !== 'SITEMAP_SUBMITTED') {
        return res.status(400).json({ error: 'Verify the site with Google before submitting a sitemap.' });
      }
      const integrationSnap = await db.collection('google_integrations').doc(decodedToken.uid).get();
      if (!integrationSnap.exists) return res.status(400).json({ error: 'Connect Google Search first.' });
      const accessToken = await getValidAccessToken(db, decodedToken.uid, integrationSnap.data());

      const siteUrl = repo.google_search_console_property;
      const sitemapUrl = `${siteUrl}sitemap.xml`;
      const result = await submitSitemapToGoogle(accessToken, siteUrl, sitemapUrl);

      await ref.set({ seo_status: 'SITEMAP_SUBMITTED', sitemap_submitted_at: result.submittedAt, sitemap_url: sitemapUrl }, { merge: true });
      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      console.error('Error in googleSubmitSitemap:', error);
      return res.status(error.httpStatus || 500).json({ error: error.message });
    }
  });
});

exports.googleSearchPerformance = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decodedToken = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
      const repoId = req.query.repoId || (req.body && req.body.repoId);
      const { data: repo } = await resolveOwnedRepo(decodedToken.uid, repoId);
      if (!repo.google_search_console_property) return res.status(200).json({ connected: false, hasData: false });

      const integrationSnap = await db.collection('google_integrations').doc(decodedToken.uid).get();
      if (!integrationSnap.exists) return res.status(200).json({ connected: false, hasData: false });
      const accessToken = await getValidAccessToken(db, decodedToken.uid, integrationSnap.data());

      const analytics = await getSearchAnalytics(accessToken, repo.google_search_console_property);
      return res.status(200).json({ connected: true, ...analytics });
    } catch (error) {
      console.error('Error in googleSearchPerformance:', error);
      return res.status(error.httpStatus || 500).json({ error: error.message });
    }
  });
});

exports.googleIndexStatus = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decodedToken = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
      const repoId = req.query.repoId || (req.body && req.body.repoId);
      const { data: repo } = await resolveOwnedRepo(decodedToken.uid, repoId);
      if (!repo.google_search_console_property) return res.status(400).json({ error: 'Connect Google Search first.' });

      const integrationSnap = await db.collection('google_integrations').doc(decodedToken.uid).get();
      if (!integrationSnap.exists) return res.status(400).json({ error: 'Connect Google Search first.' });
      const accessToken = await getValidAccessToken(db, decodedToken.uid, integrationSnap.data());

      const result = await inspectUrl(accessToken, repo.google_search_console_property, repo.google_search_console_property);
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in googleIndexStatus:', error);
      return res.status(error.httpStatus || 500).json({ error: error.message });
    }
  });
});

// ---------------------------------------------------------------------
// OpenRouter image generation — PDF sections 24-32 (Sprint 4)
// Dormant until OPENROUTER_API_KEY is actually funded — see
// integrations/openrouter/imageGeneration.js's own comment.
// ---------------------------------------------------------------------

exports.generateImage = functions.runWith({ timeoutSeconds: 60, memory: '256MB' }).https.onRequest((req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decodedToken = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
      const rateLimit = await checkRateLimit(decodedToken.uid, 'generateImage', RATE_LIMITS.generateImage);
      if (!rateLimit.allowed) return rateLimitResponse(res, rateLimit.retryAfterMs);

      const { repoId, assetType, prompt: userPrompt, aspectRatio, businessType, brandTone, locationContext } = req.body;
      const { ref } = await resolveOwnedRepo(decodedToken.uid, repoId);

      const assetsSnap = await ref.collection('assets').get();
      if (assetsSnap.size >= MAX_IMAGES_PER_SITE) {
        return res.status(400).json({ error: `This project already has the maximum ${MAX_IMAGES_PER_SITE} generated images.` });
      }

      const prompt = userPrompt || buildImagePrompt({ businessType: businessType || 'business', asset: assetType, brandTone, locationContext });
      const { buffer, mimeType, costUsd, model } = await generateOpenRouterImage({ prompt, aspectRatio });

      const ext = (mimeType.split('/')[1] || 'webp').replace(/[^a-z0-9]/gi, '');
      const storagePath = `project_assets/${repoId}/${assetType || 'image'}-${Date.now()}.${ext}`;
      const bucket = admin.storage().bucket();
      const file = bucket.file(storagePath);
      await file.save(buffer, { metadata: { contentType: mimeType } });
      await file.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

      const assetDoc = {
        type: assetType || 'other',
        prompt,
        altText: `${assetType || 'Image'} for ${businessType || 'the business'}`.slice(0, 120),
        model,
        provider: 'openrouter',
        storagePath,
        publicUrl,
        mimeType,
        generationCostUsd: costUsd ?? null,
        createdAt: new Date().toISOString(),
      };
      const assetRef = await ref.collection('assets').add(assetDoc);

      return res.status(200).json({ assetId: assetRef.id, url: publicUrl, altText: assetDoc.altText, costUsd: assetDoc.generationCostUsd });
    } catch (error) {
      console.error('Error in generateImage:', error);
      if (error.imagesDisabled) return res.status(501).json({ error: error.message });
      return res.status(error.httpStatus || 500).json({ error: error.message });
    }
  });
});

// ---------------------------------------------------------------------
// Google Places — real reviews for testimonials (agents/coders/base.js's
// applyRealReviews). API-key auth, no Google OAuth connection required.
// ---------------------------------------------------------------------

// Candidate places for a business name/address — the user picks the right
// one before it's ever linked; never auto-links off a single-result guess.
exports.findGooglePlace = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    try {
      await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
      const { query } = req.body;
      if (!query) return res.status(400).json({ error: 'Missing query' });
      const candidates = await findGooglePlaceCandidates(query);
      return res.status(200).json({ candidates });
    } catch (error) {
      console.error('Error in findGooglePlace:', error);
      return res.status(error.httpStatus || 500).json({ error: error.message });
    }
  });
});

// Links a confirmed placeId to an existing repo (createWebsite links one at
// creation time via the googlePlaceId body param instead — this is for
// linking one after the fact, or changing a wrong one).
exports.linkGooglePlace = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decodedToken = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
      const { repoId, placeId } = req.body;
      if (!repoId || !placeId) return res.status(400).json({ error: 'Missing repoId/placeId' });
      const { ref } = await resolveOwnedRepo(decodedToken.uid, repoId);
      await ref.set({ google_place_id: placeId }, { merge: true });
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error in linkGooglePlace:', error);
      return res.status(error.httpStatus || 500).json({ error: error.message });
    }
  });
});

exports.getGoogleReviews = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decodedToken = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
      const repoId = req.query.repoId || (req.body && req.body.repoId);
      const { data: repo } = await resolveOwnedRepo(decodedToken.uid, repoId);
      if (!repo.google_place_id) return res.status(400).json({ error: 'No Google Business linked to this project yet.' });
      const placeData = await getPlaceReviews(repo.google_place_id);
      return res.status(200).json(placeData);
    } catch (error) {
      console.error('Error in getGoogleReviews:', error);
      return res.status(error.httpStatus || 500).json({ error: error.message });
    }
  });
});

// ---------------------------------------------------------------------
// PageSpeed Insights — real Core Web Vitals for a project's live URL.
// ---------------------------------------------------------------------

exports.pageSpeedAudit = functions.runWith({ timeoutSeconds: 60 }).https.onRequest((req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decodedToken = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
      const { repoId } = req.body;
      const { ref, data: repo } = await resolveOwnedRepo(decodedToken.uid, repoId);
      const liveUrl = repo.vercel_production_url || repo.deploy_url;
      if (!liveUrl) return res.status(400).json({ error: 'This project has no live URL to audit yet — publish it first.' });

      const result = await runPageSpeed(liveUrl, req.body.strategy || 'mobile');
      await ref.set({ pagespeed_audit: result }, { merge: true });
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in pageSpeedAudit:', error);
      return res.status(error.httpStatus || 500).json({ error: error.message });
    }
  });
});

// ---------------------------------------------------------------------
// Uptime monitoring — UptimeRobot. One monitor per repo, keyed by the
// repo's live URL at the time monitoring was enabled (re-enable to move it
// to a new URL after a domain change).
// ---------------------------------------------------------------------

exports.enableUptimeMonitoring = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decodedToken = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
      const { repoId } = req.body;
      const { ref, data: repo } = await resolveOwnedRepo(decodedToken.uid, repoId);
      const liveUrl = repo.vercel_production_url || repo.deploy_url;
      if (!liveUrl) return res.status(400).json({ error: 'This project has no live URL to monitor yet — publish it first.' });

      const { monitorId, status } = await createUptimeMonitor(repo.repo_name || repoId, liveUrl);
      await ref.set({ uptime_monitor_id: monitorId, uptime_status: status, uptime_monitored_url: liveUrl }, { merge: true });
      return res.status(200).json({ monitorId, status });
    } catch (error) {
      console.error('Error in enableUptimeMonitoring:', error);
      return res.status(error.httpStatus || 500).json({ error: error.message });
    }
  });
});

exports.getUptimeStatus = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decodedToken = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
      const repoId = req.query.repoId || (req.body && req.body.repoId);
      const { ref, data: repo } = await resolveOwnedRepo(decodedToken.uid, repoId);
      if (!repo.uptime_monitor_id) return res.status(200).json({ monitored: false });

      const result = await getUptimeMonitorStatus(repo.uptime_monitor_id);
      await ref.set({ uptime_status: result.status }, { merge: true });
      return res.status(200).json({ monitored: true, ...result });
    } catch (error) {
      console.error('Error in getUptimeStatus:', error);
      return res.status(error.httpStatus || 500).json({ error: error.message });
    }
  });
});

exports.disableUptimeMonitoring = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decodedToken = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
      const { repoId } = req.body;
      const { ref, data: repo } = await resolveOwnedRepo(decodedToken.uid, repoId);
      if (repo.uptime_monitor_id) await deleteUptimeMonitor(repo.uptime_monitor_id);
      await ref.set({ uptime_monitor_id: null, uptime_status: null, uptime_monitored_url: null }, { merge: true });
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error in disableUptimeMonitoring:', error);
      return res.status(error.httpStatus || 500).json({ error: error.message });
    }
  });
});

// ---------------------------------------------------------------------
// Google Business Profile — NOT self-serve like Search Console. Production
// access to these APIs requires Google to approve the project first (see
// businessProfile.js's own comment); every handler below will 403 with
// Google's real error until that approval exists. Also requires
// reconnecting Google after oauth.js's SCOPES gained 'business.manage'.
// ---------------------------------------------------------------------

exports.businessProfileAccounts = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decodedToken = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
      const integrationSnap = await db.collection('google_integrations').doc(decodedToken.uid).get();
      if (!integrationSnap.exists) return res.status(400).json({ error: 'Connect Google first.' });
      const accessToken = await getValidAccessToken(db, decodedToken.uid, integrationSnap.data());

      const accounts = await listBusinessAccounts(accessToken);
      return res.status(200).json({ accounts });
    } catch (error) {
      console.error('Error in businessProfileAccounts:', error);
      return res.status(error.httpStatus || 500).json({ error: error.message });
    }
  });
});

exports.businessProfileLocations = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decodedToken = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
      const accountName = req.query.accountName || (req.body && req.body.accountName);
      if (!accountName) return res.status(400).json({ error: 'Missing accountName' });
      const integrationSnap = await db.collection('google_integrations').doc(decodedToken.uid).get();
      if (!integrationSnap.exists) return res.status(400).json({ error: 'Connect Google first.' });
      const accessToken = await getValidAccessToken(db, decodedToken.uid, integrationSnap.data());

      const locations = await listBusinessLocations(accessToken, accountName);
      return res.status(200).json({ locations });
    } catch (error) {
      console.error('Error in businessProfileLocations:', error);
      return res.status(error.httpStatus || 500).json({ error: error.message });
    }
  });
});

exports.businessProfileLocation = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decodedToken = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
      const repoId = req.query.repoId || (req.body && req.body.repoId);
      const { data: repo } = await resolveOwnedRepo(decodedToken.uid, repoId);
      if (!repo.google_business_location_name) return res.status(400).json({ error: 'No Business Profile location linked to this project yet.' });
      const integrationSnap = await db.collection('google_integrations').doc(decodedToken.uid).get();
      if (!integrationSnap.exists) return res.status(400).json({ error: 'Connect Google first.' });
      const accessToken = await getValidAccessToken(db, decodedToken.uid, integrationSnap.data());

      const location = await getBusinessLocation(accessToken, repo.google_business_location_name);
      return res.status(200).json(location);
    } catch (error) {
      console.error('Error in businessProfileLocation:', error);
      return res.status(error.httpStatus || 500).json({ error: error.message });
    }
  });
});

// Also links google_business_location_name to the repo on first use, so
// callers only ever need to pass it once (via `locationName`, the resource
// name from businessProfileLocations).
exports.businessProfileUpdateLocation = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decodedToken = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
      const { repoId, locationName, patch } = req.body;
      if (!repoId || !patch || typeof patch !== 'object') return res.status(400).json({ error: 'Missing repoId/patch' });
      const { ref, data: repo } = await resolveOwnedRepo(decodedToken.uid, repoId);
      const resolvedLocationName = locationName || repo.google_business_location_name;
      if (!resolvedLocationName) return res.status(400).json({ error: 'Missing locationName and no location linked yet.' });
      const integrationSnap = await db.collection('google_integrations').doc(decodedToken.uid).get();
      if (!integrationSnap.exists) return res.status(400).json({ error: 'Connect Google first.' });
      const accessToken = await getValidAccessToken(db, decodedToken.uid, integrationSnap.data());

      const updated = await updateBusinessLocation(accessToken, resolvedLocationName, patch);
      await ref.set({ google_business_location_name: resolvedLocationName }, { merge: true });
      return res.status(200).json(updated);
    } catch (error) {
      console.error('Error in businessProfileUpdateLocation:', error);
      return res.status(error.httpStatus || 500).json({ error: error.message });
    }
  });
});

exports.businessProfilePost = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decodedToken = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
      const { repoId, post } = req.body;
      if (!post || typeof post !== 'object') return res.status(400).json({ error: 'Missing post' });
      const { data: repo } = await resolveOwnedRepo(decodedToken.uid, repoId);
      if (!repo.google_business_location_name) return res.status(400).json({ error: 'No Business Profile location linked to this project yet.' });
      const integrationSnap = await db.collection('google_integrations').doc(decodedToken.uid).get();
      if (!integrationSnap.exists) return res.status(400).json({ error: 'Connect Google first.' });
      const accessToken = await getValidAccessToken(db, decodedToken.uid, integrationSnap.data());

      const created = await createLocalPost(accessToken, repo.google_business_location_name, post);
      return res.status(200).json(created);
    } catch (error) {
      console.error('Error in businessProfilePost:', error);
      return res.status(error.httpStatus || 500).json({ error: error.message });
    }
  });
});

// ---------------------------------------------------------------------
// Vercel Domains — connecting a business's own domain to a published
// project. Requires the project to already be published via Vercel
// (vercel_project_id set by publishWebsite).
// ---------------------------------------------------------------------

exports.connectDomain = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decodedToken = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
      const { repoId, domain } = req.body;
      if (!domain) return res.status(400).json({ error: 'Missing domain' });
      const { ref, data: repo } = await resolveOwnedRepo(decodedToken.uid, repoId);
      if (!repo.vercel_project_id) return res.status(400).json({ error: 'Publish this project via Vercel before connecting a domain.' });

      await addDomainToProject(repo.vercel_project_id, domain);
      const config = await getDomainConfig(domain);
      await ref.set({ custom_domain: domain, custom_domain_status: config.misconfigured ? 'MISCONFIGURED' : 'PENDING' }, { merge: true });
      return res.status(200).json({ domain, config });
    } catch (error) {
      console.error('Error in connectDomain:', error);
      return res.status(error.httpStatus || 500).json({ error: error.message });
    }
  });
});

exports.getDomainStatus = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decodedToken = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
      const repoId = req.query.repoId || (req.body && req.body.repoId);
      const { ref, data: repo } = await resolveOwnedRepo(decodedToken.uid, repoId);
      if (!repo.custom_domain) return res.status(200).json({ connected: false });

      const config = await getDomainConfig(repo.custom_domain);
      const status = config.misconfigured ? 'MISCONFIGURED' : 'VERIFIED';
      await ref.set({ custom_domain_status: status }, { merge: true });
      return res.status(200).json({ connected: true, domain: repo.custom_domain, status, config });
    } catch (error) {
      console.error('Error in getDomainStatus:', error);
      return res.status(error.httpStatus || 500).json({ error: error.message });
    }
  });
});

exports.disconnectDomain = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decodedToken = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
      const { repoId } = req.body;
      const { ref, data: repo } = await resolveOwnedRepo(decodedToken.uid, repoId);
      if (repo.vercel_project_id && repo.custom_domain) {
        await removeDomainFromProject(repo.vercel_project_id, repo.custom_domain);
      }
      await ref.set({ custom_domain: null, custom_domain_status: null }, { merge: true });
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error in disconnectDomain:', error);
      return res.status(error.httpStatus || 500).json({ error: error.message });
    }
  });
});
