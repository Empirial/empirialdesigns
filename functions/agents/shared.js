// Cross-layer building blocks used by more than one of the numbered layer
// folders — the fixed 6-section shape, style/palette math, and JSON/
// code-fence text cleanup. Doesn't belong to any single layer (01-10) on
// its own, so it stays a sibling of them rather than living inside one.
// See docs/MULTI_AGENT_ORCHESTRATION.md. The model call itself lives in
// 01-model/provider.js; individual agent behavior lives in
// 05-agent-loop/{goalSetter,manager,coders/*}.js.

// The doc's fixed 6-section shape. Nav/Footer are the two "link" sections
// that need to know what the other sections currently are; the rest are
// pure content sections that never need to see each other's output.
const SECTION_FILES = {
  nav: 'src/components/Navigation.tsx',
  hero: 'src/components/Hero.tsx',
  about: 'src/components/About.tsx',
  services: 'src/components/Services.tsx',
  testimonials: 'src/components/Testimonials.tsx',
  footer: 'src/components/Footer.tsx',
};
const CONTENT_SECTIONS = ['hero', 'about', 'services', 'testimonials'];
const LINK_SECTIONS = ['nav', 'footer'];
const ALL_SECTIONS = [...CONTENT_SECTIONS, 'nav', 'footer'];

// Style packs — see docs/MULTI_AGENT_ORCHESTRATION.md's "Style packs"
// section. 'default' keeps the original behavior: any of 9 randomly-chosen
// wireframes per section, no shared visual language across sections. A
// named style instead pins every section to the one wireframe (id 10/11/12)
// authored for that style, so a whole site draws from one coherent design
// language (translucent/spring-feel for apple, high-contrast raw-block for
// brutalist, quiet/spare for minimalist) instead of a random mix.
const STYLES = ['default', 'apple', 'brutalist', 'minimalist'];
const STYLE_WIREFRAME_ID = { apple: 10, brutalist: 11, minimalist: 12 };

// Manager assigns a wireframe per section it dispatches — this just draws
// the id. Style-less (or 'default') draws are random across the original 9;
// a named style is pinned to that style's one wireframe per section.
function pickWireframeId(style) {
  if (style && STYLE_WIREFRAME_ID[style]) return STYLE_WIREFRAME_ID[style];
  return Math.floor(Math.random() * 9) + 1;
}

// Per-business color — see docs/MULTI_AGENT_ORCHESTRATION.md's "Color
// palette" section. Every generated site used to share one hardcoded
// grayscale HSL set (see index.js's old getShellFiles); this replaces that
// with real per-site color while keeping contrast structurally guaranteed
// rather than merely "validated." The LLM (goalSetter.js) only ever picks
// two hues and a saturation — three small numbers, clamped below — never
// raw HSL triples for all 19 CSS variables. Every role's lightness is a
// fixed constant baked into the formula, so a bad hue pick can produce an
// ugly color, never unreadable text: background/foreground stay ~99%/~9%
// lightness, primary stays dark enough (38%) for white text on top,
// regardless of which hue the model chose. destructive is intentionally
// never themed — error red should never shift with the brand.
const DEFAULT_PALETTE = { baseHue: 240, accentHue: 240, accentSaturation: 6 };

function clampHue(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return DEFAULT_PALETTE.baseHue;
  return ((v % 360) + 360) % 360;
}

function clampSaturation(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return DEFAULT_PALETTE.accentSaturation;
  return Math.min(70, Math.max(6, v));
}

// Locked in once at creation (see pipeline.js) and carried forward on every
// edit, exactly like STYLE_WIREFRAME_ID — a copy tweak should never silently
// recolor the site. Returns the full shadcn-shaped CSS variable set (camelCase
// keys — index.js formats these into `--kebab-case: value;` lines).
function buildPaletteVars(palette) {
  const baseHue = clampHue(palette?.baseHue);
  const accentHue = clampHue(palette?.accentHue);
  const accentSat = clampSaturation(palette?.accentSaturation);

  return {
    background: `${baseHue} 15% 99%`,
    foreground: `${baseHue} 12% 9%`,
    card: `${baseHue} 15% 99%`,
    cardForeground: `${baseHue} 12% 9%`,
    popover: `${baseHue} 15% 99%`,
    popoverForeground: `${baseHue} 12% 9%`,
    primary: `${accentHue} ${accentSat}% 38%`,
    primaryForeground: '0 0% 98%',
    secondary: `${baseHue} 14% 95%`,
    secondaryForeground: `${baseHue} 12% 12%`,
    muted: `${baseHue} 14% 95%`,
    mutedForeground: `${baseHue} 8% 42%`,
    accent: `${accentHue} ${accentSat}% 94%`,
    accentForeground: `${accentHue} ${accentSat}% 24%`,
    destructive: '0 72% 51%',
    destructiveForeground: '0 0% 98%',
    border: `${baseHue} 14% 89%`,
    input: `${baseHue} 14% 89%`,
    ring: `${accentHue} ${accentSat}% 38%`,
    radius: '0.5rem',
  };
}

// Single source of truth for src/index.css's content — used by index.js's
// getShellFiles() on create, and by pipeline.js's recolor path on an edit
// that explicitly asks to change color (see docs/MULTI_AGENT_ORCHESTRATION.md's
// "Color palette" section). Keeping this here rather than duplicated in
// index.js means a recolor edit produces byte-for-byte the same file shape
// a fresh create would.
function buildIndexCssFile(palette) {
  const vars = buildPaletteVars(palette);
  const varLines = Object.entries(vars)
    .map(([key, value]) => `    --${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}: ${value};`)
    .join('\n');
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
${varLines}
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
`;
}

// Coders are told not to wrap their answer, but models don't always listen —
// strip ```lang fences and stray <file> tags defensively so the deterministic
// wrapping in coders/base.js never doubles up.
function stripCodeFences(text) {
  let out = text.trim();
  const fenceMatch = out.match(/^```[a-zA-Z]*\n([\s\S]*?)\n```$/);
  if (fenceMatch) out = fenceMatch[1].trim();
  const fileTagMatch = out.match(/^<file\s+path="[^"]*">([\s\S]*?)<\/file>$/);
  if (fileTagMatch) out = fileTagMatch[1].trim();
  return out;
}

function extractJson(text, fallback) {
  try {
    let candidate = text.trim();
    const fenceMatch = candidate.match(/^```[a-zA-Z]*\n([\s\S]*?)\n```$/);
    if (fenceMatch) candidate = fenceMatch[1].trim();
    // Some models add a sentence before/after the JSON object — grab the
    // outermost {...} span rather than requiring the whole string to parse.
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start === -1 || end === -1 || end < start) throw new Error('no JSON object found');
    return JSON.parse(candidate.slice(start, end + 1));
  } catch (e) {
    return fallback;
  }
}

function buildFileBlock(path, content) {
  return `<file path="${path}">\n${content}\n</file>\n\n`;
}

// Structural write-ownership guard — see 05-agent-loop/pipeline.js and
// index.js's aiChat handler for where this is actually enforced. The 6
// section Coders (dispatched by manager.js) and the File Editor agent
// (fileEditor.js) run concurrently every turn on the assumption that they
// touch disjoint files; before this existed, the ONLY thing preventing a
// collision was a line in fileEditor.js's own system prompt telling the
// model not to touch the 6 section paths — a prompt is not access control.
// This is the one real chokepoint both callers filter every file list
// through: reservedPaths is always Object.values(SECTION_FILES) (the 6
// fixed section outputs) for the current pipeline shape, but is passed in
// rather than hardcoded so a future reserved-path source doesn't need a
// second copy of this function.
//
// Returns { allowed, rejected } rather than throwing: a collision here is
// the same kind of "one thing failed, don't take the whole turn down with
// it" case manager.js's own per-section try/catch already treats as
// recoverable — see pipeline.js's call site for how a rejection gets logged
// and the section Coder's own version of that path always wins.
function partitionByOwnership(files, reservedPaths) {
  const allowed = [];
  const rejected = [];
  for (const f of files) {
    const path = (f.path || '').replace(/^\/+/, '');
    if (reservedPaths.includes(path)) rejected.push(f);
    else allowed.push(f);
  }
  return { allowed, rejected };
}

// Parses one or more <file path="...">...</file> blocks out of a (possibly
// prose-prefixed) model response — the wire format 05-agent-loop/
// fileEditor.js's final answer uses to return several files in one
// response, mirroring the client's parseAiFileBlocks
// (src/features/builder/lib/aiChat.ts) since both sides need to agree on
// the same tag shape. The 6 section Coders never need this themselves: each
// one returns exactly one file's raw content, wrapped separately by
// buildFileBlock above — only the File Editor asks a model to emit several
// of these in a single response.
function parseFileBlocks(text) {
  const fileRegex = /<file\s+path="([^"]+)">([\s\S]*?)<\/file>/g;
  const files = [];
  let match;
  while ((match = fileRegex.exec(text)) !== null) {
    const path = match[1].trim();
    const content = match[2].trim();
    if (path && content) files.push({ path, content });
  }
  return files;
}

// The prose part of a File Editor response — everything outside its <file>
// blocks, trimmed. Mirrors the client's stripFileBlocksForDisplay, for the
// same reason: the raw file content was never meant for the chat bubble.
function stripFileBlocksFromText(text) {
  return text.replace(/<file\s+path="[^"]*">[\s\S]*?<\/file>/g, '').trim();
}

module.exports = {
  extractJson,
  stripCodeFences,
  buildFileBlock,
  parseFileBlocks,
  stripFileBlocksFromText,
  pickWireframeId,
  partitionByOwnership,
  SECTION_FILES,
  CONTENT_SECTIONS,
  LINK_SECTIONS,
  ALL_SECTIONS,
  STYLES,
  DEFAULT_PALETTE,
  clampHue,
  clampSaturation,
  buildPaletteVars,
  buildIndexCssFile,
};
