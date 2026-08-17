// LocalBusiness/Organization JSON-LD — PDF section 12. Deliberately narrow:
// only fields the manifest actually knows (name, description, canonical
// URL) are emitted. Phone/address/hours are NOT invented here even though
// the footer coder (functions/agents/coders/footer.js) does synthesize
// plausible-but-generic contact details for the *visible* page — this
// generator has no access to that generated content at createWebsite time,
// and PDF section 12 is explicit: structured data must reflect content
// actually present on the page, never invented separately from it. A future
// pass could parse the committed footer file for its actual phone/email and
// thread them in here; until then, omitting is the honest choice.
function buildStructuredData(manifest) {
  const page = manifest.pages[0];
  const json = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: manifest.business.name,
    description: manifest.business.description,
  };
  if (page && page.canonical) {
    json.url = page.canonical;
  }
  return json;
}

function buildStructuredDataScript(manifest) {
  return `<script type="application/ld+json">\n${JSON.stringify(buildStructuredData(manifest), null, 2)}\n</script>`;
}

module.exports = { buildStructuredData, buildStructuredDataScript };
