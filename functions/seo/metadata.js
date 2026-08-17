// Renders an SeoManifest's root-page entry into the <head> tags PDF section
// 8.1 calls for, and splices them into the generated site's index.html.
// Kept as plain string templating (same style as getShellFiles in
// ../index.js) rather than an HTML parser — index.html is always the exact
// shape getShellFiles produces, so a fixed insertion point is safe.
function renderHeadTags(page, manifest) {
  const url = page.canonical || manifest.domain ? `https://${manifest.domain}${page.path}` : '';
  const tags = [
    `<meta name="description" content="${escapeAttr(page.description)}" />`,
    page.canonical ? `<link rel="canonical" href="${escapeAttr(page.canonical)}" />` : '',
    `<meta property="og:title" content="${escapeAttr(page.title)}" />`,
    `<meta property="og:description" content="${escapeAttr(page.description)}" />`,
    url ? `<meta property="og:url" content="${escapeAttr(url)}" />` : '',
    `<meta property="og:type" content="website" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeAttr(page.title)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(page.description)}" />`,
  ].filter(Boolean);
  return tags.join('\n    ');
}

// Google Search Console verification is a single <meta> tag inserted into
// this same <head> — see functions/integrations/google/verification.js.
// Kept as its own line (not folded into renderHeadTags) since it's only
// present once a user has actually started the Google-connect flow, unlike
// the tags above which exist on every generated site.
function renderVerificationTag(token) {
  return `<meta name="google-site-verification" content="${escapeAttr(token)}" />`;
}

// Splices SEO <head> tags (and, optionally, a Search Console verification
// tag + JSON-LD structured-data script) into an index.html string produced
// by getShellFiles. Replaces the bare <title> with the manifest's page
// title and injects everything else right after it; the JSON-LD script goes
// just before </head> since it isn't a <meta>/<link> tag.
function injectHeadTags(indexHtml, page, manifest, { verificationToken, structuredDataScript } = {}) {
  const headTags = renderHeadTags(page, manifest);
  const verification = verificationToken ? '\n    ' + renderVerificationTag(verificationToken) : '';
  let html = indexHtml
    .replace(/<title>.*<\/title>/, `<title>${escapeAttr(page.title)}</title>\n    ${headTags}${verification}`);
  if (structuredDataScript) {
    html = html.replace('</head>', `    ${structuredDataScript}\n  </head>`);
  }
  return html;
}

function escapeAttr(value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

module.exports = { renderHeadTags, renderVerificationTag, injectHeadTags };
