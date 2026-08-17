// sitemap.xml generation — PDF section 10. One <url> per manifest page
// (currently always exactly one, the SPA's root — see manifest.js's own
// comment on why this app doesn't fabricate multi-page entries).
function buildSitemap(manifest) {
  const urls = manifest.pages
    .filter((p) => p.index)
    .map((p) => {
      const loc = p.canonical || (manifest.domain ? `https://${manifest.domain}${p.path}` : null);
      return loc ? `  <url>\n    <loc>${escapeXml(loc)}</loc>\n  </url>` : null;
    })
    .filter(Boolean);

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

function escapeXml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

module.exports = { buildSitemap };
