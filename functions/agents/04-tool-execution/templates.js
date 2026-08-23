// Layer 4: tool execution — the coders' one real "tool" is the prebuilt
// template library (./templates/<section>/<wireframeId>.tsx). A coder never
// writes or touches code; its LLM call only returns copy for a fixed set of
// {{TOKEN}} placeholders (see 02-system-prompts/coder.js's response shape),
// and this file is what actually loads the chosen template and deterministically
// stamps that copy into it. 05-agent-loop/coders/runCoder.js is the caller —
// it decides WHICH wireframe/tokens/values, this file is what DOES the
// substitution. Extracted 1:1 from what used to be agents/coders/base.js so
// the layer distinction (decide vs. execute) has a real file boundary, not
// just a comment.
const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, 'templates');
const TOKEN_RE = /\{\{([A-Z0-9_]+)\}\}/g;

// A token used as a bare JSX attribute value — e.g. `href={{NAV_LINK_HREF}}`
// — reads as valid JSX at template-authoring time (a `{...}` expression
// container around an object-literal shorthand `{X}`), but stamp() below
// does a raw string replace of the *entire* `{{TOKEN}}` span, braces
// included. That turns it into `href=#hero`: no braces, no quotes, invalid
// JSX — the exact bug a live generated site hit (see docs/CODE_REVIEW.md
// entry from 2026-08-13). The fix is always the same: wrap the token in a
// template literal, `href={\`{{NAV_LINK_HREF}}\`}`, so what's left after
// stamping is a quoted string no matter what the token resolves to — same
// pattern the EMAIL/PHONE mailto:/tel: links already use everywhere.
// Every existing template was swept clean of the bare form; this check
// exists so a *new* template (a 10th wireframe, a new section) fails loudly
// at load time instead of silently shipping the same landmine again.
const BARE_ATTR_TOKEN_RE = /[a-zA-Z-]+=\{\{[A-Z0-9_]+\}\}/;

function loadTemplate(section, wireframeId) {
  const file = path.join(TEMPLATES_DIR, section, `${String(wireframeId).padStart(2, '0')}.tsx`);
  const source = fs.readFileSync(file, 'utf8');
  const badMatch = source.match(BARE_ATTR_TOKEN_RE);
  if (badMatch) {
    throw new Error(
      `Template ${section}/${wireframeId} has a bare-braced token in attribute position (${badMatch[0]}), ` +
      `which stamp() would turn into invalid JSX (e.g. href=#hero). Wrap it in a template literal instead: ` +
      `${badMatch[0].split('=')[0]}={\`${badMatch[0].split('=')[1]}\`}`
    );
  }
  return source;
}

// Every distinct {{TOKEN}} the template actually uses — a file only ever
// contains the tokens its own layout needs, so this drives exactly what
// gets asked for below, nothing more.
function extractTokens(templateSource) {
  const tokens = new Set();
  let m;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(templateSource)) !== null) tokens.add(m[1]);
  return [...tokens];
}

// Tokens that are never worth an LLM call: image/avatar sources (nothing
// generates real images here — a placeholder image service fill is more
// honest than asking a text model to invent a URL) and the copyright year
// (trivially deterministic). Every other token is real business copy and
// goes to the content-writer call in runCoder.js.
function isAssetToken(token) {
  return token.endsWith('_URL');
}

function assetFallback(token, section) {
  if (token.includes('AVATAR')) return 'https://placehold.co/96x96/e2e8f0/475569?text=%20';
  return `https://placehold.co/960x640/e2e8f0/475569?text=${encodeURIComponent(section)}`;
}

// Deterministic string replace — every matched token gets a value, never
// left as literal {{TOKEN}} text. That matters beyond cosmetics: a
// {{TOKEN}} left inside a JSX child position (not a quoted attribute) is
// invalid TypeScript once compiled (JSX reads {{X}} as an object-literal
// expression referencing an undefined identifier X), so an unresolved
// token would break the generated site's build, not just look wrong.
function stamp(templateSource, section, values) {
  return templateSource.replace(TOKEN_RE, (match, token) => {
    if (token === 'COPYRIGHT_YEAR') return String(new Date().getFullYear());
    // A real avatar URL (from runCoder.js's applyRealReviews) wins over the
    // placeholder-image fallback; every other _URL token has no such source
    // and always falls back, since nothing here generates real images.
    if (isAssetToken(token)) return values[token] ? String(values[token]) : assetFallback(token, section);
    const value = values[token];
    return value === undefined || value === null ? '' : String(value);
  });
}

// Deterministic, non-LLM addition to a stamped footer — a real Google Maps
// embed, added right before the footer's closing tag (or into wireframe 08's
// own map slot — see below). Never built from the footer coder's own
// AI-invented mock address (see 02-system-prompts/goalSetter.js's
// contact-details rule): a map pin implies a precision a fabricated address
// doesn't have. Two real sources, preferred in this order:
//   1. A verified Google Place id (functions/index.js's linkGooglePlace) —
//      the precise, business-confirmed location.
//   2. A real street address the user actually typed into chat this turn
//      (05-agent-loop/goalSetter.js's `real_address`, only ever set from the
//      raw message itself, never invented) — a plain address-search embed,
//      less precise than a Place pin but still a genuine location, not a
//      fabricated one.
// Both are keyless — Google's classic `/maps?q=` search accepts either
// `place_id:...` or a plain address string, no API key required.
function resolveMapEmbedSrc(placeId, address) {
  if (placeId) return `https://www.google.com/maps?q=place_id:${encodeURIComponent(placeId)}&output=embed`;
  if (address) return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
  return null;
}

function buildMapEmbedBlock(src) {
  return `
      <div className="mt-8 overflow-hidden rounded-lg border border-border">
        <iframe
          src="${src}"
          width="100%"
          height="240"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Location map"
        ></iframe>
      </div>
`;
}

// Same iframe, sized to drop into wireframe 08's own map slot (see below)
// instead of being appended as a new block.
function buildMapEmbedSlot(src) {
  return `<div className="h-48 w-full overflow-hidden rounded-lg border border-border md:h-full">
              <iframe
                src="${src}"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Location map"
              ></iframe>
            </div>`;
}

const MAP_SLOT_RE = /\{\/\* MAP_EMBED_SLOT_START \*\/\}[\s\S]*?\{\/\* MAP_EMBED_SLOT_END \*\/\}/;
const MAP_SLOT_MARKER_LINE_RE = /^[ \t]*\{\/\* MAP_EMBED_SLOT_(?:START|END) \*\/\}\n/gm;

// Every one of the 12 footer wireframes ends with the same `</footer>` (see
// templates/footer/*.tsx) — inserting right before that closing tag works
// uniformly across all of them without editing any hand-authored template
// file, and without needing a new {{TOKEN}} the LLM would have to be told
// to use correctly. Wireframe 08 is the one exception: it already reserves
// an honest "Map preview unavailable" placeholder for this exact spot
// (marked with a MAP_EMBED_SLOT_START/END comment pair), so a real map
// replaces that placeholder in place instead of stacking a second map below
// it; with no real source available, the marker comments are just stripped
// and the honest placeholder stays.
function injectMapEmbed(footerContent, placeId, address) {
  const src = resolveMapEmbedSrc(placeId, address);
  const hasSlot = MAP_SLOT_RE.test(footerContent);

  if (!src) {
    // No real source — leave wireframe 08's honest placeholder as-is, just
    // drop the now-inert marker comment lines from the shipped output.
    return hasSlot ? footerContent.replace(MAP_SLOT_MARKER_LINE_RE, '') : footerContent;
  }

  if (hasSlot) return footerContent.replace(MAP_SLOT_RE, buildMapEmbedSlot(src));

  const closeIdx = footerContent.lastIndexOf('</footer>');
  if (closeIdx === -1) return footerContent;
  return footerContent.slice(0, closeIdx) + buildMapEmbedBlock(src) + '    ' + footerContent.slice(closeIdx);
}

module.exports = { loadTemplate, extractTokens, isAssetToken, assetFallback, stamp, injectMapEmbed };
