// SEO readiness audit — PDF section 13. Deliberately called a "technical
// readiness score", never a ranking/Google score (PDF is explicit about
// that distinction). Runs against a project's current committed files
// (fetched from GitHub — see seoAudit in ../index.js), not against Firestore
// metadata, so it reflects what's actually live in the repo.
function auditFiles(files) {
  const indexHtml = files['index.html'] || '';
  const checks = {
    pageTitles: /<title>[^<]{4,}<\/title>/.test(indexHtml),
    metaDescriptions: /<meta\s+name="description"\s+content="[^"]{10,}"/.test(indexHtml),
    canonicalUrls: /<link\s+rel="canonical"/.test(indexHtml),
    sitemap: typeof files['sitemap.xml'] === 'string' && files['sitemap.xml'].includes('<urlset'),
    robotsTxt: typeof files['robots.txt'] === 'string' && /Allow:\s*\//.test(files['robots.txt']),
    structuredData: /application\/ld\+json/.test(indexHtml),
    altText: !/<img(?![^>]*\balt=)[^>]*>/.test(Object.values(files).join('\n')),
    mobileViewport: /<meta\s+name="viewport"/.test(indexHtml),
    indexable: !/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(indexHtml),
  };

  const total = Object.keys(checks).length;
  const passed = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passed / total) * 100);

  return { score, checks };
}

module.exports = { auditFiles };
