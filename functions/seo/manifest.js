// Builds the SEO manifest for a generated site (docs/AI_WEBSITE_BUILDER PDF
// section 8) from what createWebsite already knows about the project —
// no extra AI call. Every generated site today is a single-page SPA (one
// index.html, one App.tsx rendering Nav/Hero/About/Services/Testimonials/
// Footer as sections on one page — see getShellFiles in ../index.js), so
// this manifest describes exactly one indexable page, honestly, rather than
// fabricating a multi-page sitemap the site doesn't actually have.
//
// `detected` is detectWebsiteType()'s return shape; `companyName`/`prompt`
// come straight from the createWebsite request body.
function buildSeoManifest({ companyName, prompt, detected, domain }) {
  const siteName = companyName || 'AI-generated website';
  const industry = detected && detected.type ? detected.type : 'business';
  const description = summarize(prompt, siteName, industry);

  return {
    siteName,
    domain: domain || '',
    business: {
      name: siteName,
      description,
      industry,
    },
    pages: [
      {
        path: '/',
        title: `${siteName} — ${titleCase(industry)}`.slice(0, 60),
        description,
        // Left blank until a production domain exists (Vercel publish or a
        // connected custom domain) — a canonical pointing at nothing isn't
        // better than no canonical, see PDF section 19.
        canonical: domain ? `https://${domain}/` : '',
        index: true,
      },
    ],
  };
}

// One clean sentence, not the raw prompt verbatim — meta descriptions render
// in search results, so keep it inside Google's ~155-char practical limit.
function summarize(prompt, siteName, industry) {
  const clean = (prompt || '').replace(/\s+/g, ' ').trim();
  const base = clean || `${siteName} — a ${industry} business`;
  return base.length > 155 ? base.slice(0, 152).trimEnd() + '…' : base;
}

function titleCase(value) {
  return String(value)
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

module.exports = { buildSeoManifest };
