// Low-level building blocks shared by every agent in the pipeline — the one
// DeepSeek call, JSON/code-fence cleanup, and the fixed 6-section shape.
// See docs/MULTI_AGENT_ORCHESTRATION.md. Individual agent behavior does NOT
// live here — see goalSetter.js, manager.js, coders/*.js.
//
// Was OpenRouter (kept the free-tier model's 50-requests/day account-wide
// cap from being usable beyond solo testing — one full-site rebrand alone
// can burn 8+ of those 50). DeepSeek's API is OpenAI-compatible, same
// request/response shape, so this is the only file that needed to change.

const fetch = require('node-fetch');

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

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

// Sampling profiles — every agent used to share one fixed temperature:0.7
// regardless of what kind of call it was. Split into two, since the two
// kinds of call want opposite things:
//   'decision' — Request Taker / Goal Setter. These return a strict JSON
//     shape that downstream code parses and trusts (affected_sections,
//     section_goals, style/palette) — low temperature/top_p keeps the model
//     literal and consistent instead of creatively reinterpreting the
//     request. frequency/presence penalty stay at 0: there's no repeated
//     prose here to discourage repeating.
//   'copy' — the 6 Coders. They're writing marketing copy into a handful of
//     {{TOKEN}} fields — higher temperature/top_p gives more natural
//     variety, and a mild frequency/presence penalty discourages the same
//     word/phrase showing up twice across a small set of fields (e.g. the
//     headline and the CTA both reaching for "amazing").
// Override per-call by passing a different profile (or a one-off object) as
// callAgent's 5th argument; these are just the defaults for the two
// existing call sites (goalSetter.js uses 'decision', coders/base.js uses
// 'copy').
const SAMPLING_PROFILES = {
  decision: { temperature: 0.3, top_p: 0.9, frequency_penalty: 0, presence_penalty: 0 },
  copy: { temperature: 0.8, top_p: 0.95, frequency_penalty: 0.3, presence_penalty: 0.1 },
};

async function callAgent(apiKey, model, systemPrompt, userContent, sampling = SAMPLING_PROFILES.decision) {
  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: sampling.temperature,
      top_p: sampling.top_p,
      frequency_penalty: sampling.frequency_penalty,
      presence_penalty: sampling.presence_penalty,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Agent call failed (${res.status}): ${detail.slice(0, 300)}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Agent call returned no content');
  return content;
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

module.exports = {
  callAgent,
  SAMPLING_PROFILES,
  extractJson,
  stripCodeFences,
  buildFileBlock,
  pickWireframeId,
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
