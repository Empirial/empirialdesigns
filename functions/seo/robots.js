// robots.txt — PDF section 11. Production only: this app has no separate
// preview deployment domain today (Firebase preview is the Sandpack VFS
// in-browser, never its own crawlable URL — see docs/AI_BUILDER_ENGINE.md),
// so there's no "don't index the draft" case to special-case yet. If/when a
// real Firebase Hosting preview URL per project exists, that's where a
// `Disallow: /` variant belongs — not here.
function buildRobotsTxt(manifest) {
  const sitemapLine = manifest.domain ? `\nSitemap: https://${manifest.domain}/sitemap.xml\n` : '\n';
  return `User-agent: *\nAllow: /\n${sitemapLine}`;
}

module.exports = { buildRobotsTxt };
