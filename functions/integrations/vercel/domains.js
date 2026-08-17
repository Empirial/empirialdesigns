// Domains API — reuses client.js's vercelRequest (same auth/team-id/error
// handling as publish.js). The project must already exist before any of
// these are reachable — ensureVercelProject (publish.js) runs on first
// publish, well before a user would try to attach a custom domain.
const { vercelRequest } = require('./client');

async function addDomainToProject(projectIdOrName, domain) {
  return vercelRequest(`/v10/projects/${encodeURIComponent(projectIdOrName)}/domains`, {
    method: 'POST',
    body: JSON.stringify({ name: domain }),
  });
}

// The DNS records the business needs to add at their registrar, plus
// misconfigured/verified state — returned as-is from Vercel, never guessed
// or inferred, since a wrong DNS instruction here breaks a real domain.
async function getDomainConfig(domain) {
  return vercelRequest(`/v6/domains/${encodeURIComponent(domain)}/config`);
}

async function getProjectDomain(projectIdOrName, domain) {
  return vercelRequest(`/v9/projects/${encodeURIComponent(projectIdOrName)}/domains/${encodeURIComponent(domain)}`);
}

async function removeDomainFromProject(projectIdOrName, domain) {
  return vercelRequest(`/v9/projects/${encodeURIComponent(projectIdOrName)}/domains/${encodeURIComponent(domain)}`, {
    method: 'DELETE',
  });
}

module.exports = { addDomainToProject, getDomainConfig, getProjectDomain, removeDomainFromProject };
