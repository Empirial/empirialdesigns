// Vercel project creation + deployment — PDF sections 6.4-6.8. API shapes
// below follow Vercel's documented v9/v10/v13 REST endpoints as of this
// writing; Vercel's SDK/REST contracts do shift over time (the PDF's own
// section 48 flags this), so if a live call here 4xxs with an unexpected
// body, check https://vercel.com/docs/rest-api before assuming the ownership
// check or the caller is wrong.
const fetch = require('node-fetch');
const { vercelRequest } = require('./client');

// Looks up (or, on first publish, creates) the Vercel project linked to a
// generated site's GitHub repo. Idempotent: safe to call on every publish.
async function ensureVercelProject(projectName, repoOwner, repoName) {
  try {
    return await vercelRequest(`/v9/projects/${encodeURIComponent(projectName)}`);
  } catch (err) {
    if (err.vercelStatus !== 404) throw err;
  }

  // PDF section 6.7: keep framework config aligned with what createWebsite
  // actually generates — every project here is a Vite/React SPA, never
  // Next.js, so this is never inferred, always explicit.
  return vercelRequest('/v10/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: projectName,
      framework: 'vite',
      gitRepository: { type: 'github', repo: `${repoOwner}/${repoName}` },
    }),
  });
}

// GitHub's numeric repo id — Vercel's deployment gitSource wants this, not
// owner/repo, to unambiguously identify the repo (handles renames/transfers
// correctly, which owner/repo strings don't).
async function getGithubRepoId(repoOwner, repoName, githubToken) {
  const res = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}`, {
    headers: { Authorization: `Bearer ${githubToken}`, Accept: 'application/vnd.github.v3+json' },
  });
  if (!res.ok) throw new Error(`Could not read GitHub repo id (${res.status})`);
  const data = await res.json();
  return data.id;
}

// Triggers a production deployment explicitly (PDF section 6.6, step 12)
// rather than waiting on Vercel's GitHub-push webhook to fire — deterministic,
// and gives publishWebsite a deployment id to poll immediately instead of
// guessing whether/when a webhook-triggered build started.
async function createProductionDeployment(project, repoOwner, repoName, githubToken) {
  const repoId = await getGithubRepoId(repoOwner, repoName, githubToken);
  const branch = process.env.VERCEL_PRODUCTION_BRANCH || 'main';

  return vercelRequest('/v13/deployments', {
    method: 'POST',
    body: JSON.stringify({
      name: project.name,
      project: project.id,
      target: 'production',
      gitSource: { type: 'github', repoId, ref: branch },
    }),
  });
}

async function getDeployment(deploymentId) {
  return vercelRequest(`/v13/deployments/${deploymentId}`);
}

// Vercel's readyState: QUEUED | BUILDING | READY | ERROR | CANCELED.
// Mapped to the app's own simpler vocabulary (PDF section 5's
// vercelDeploymentStatus union) so the frontend never has to know Vercel's
// specific enum.
function mapReadyState(readyState) {
  if (readyState === 'READY') return 'READY';
  if (readyState === 'ERROR' || readyState === 'CANCELED') return 'ERROR';
  return 'BUILDING';
}

// Polls a fresh deployment for up to `maxWaitMs` (default short — this runs
// inside an HTTP function call, not a background job) so a fast build can
// return READY synchronously; a slower build just comes back BUILDING and
// the frontend polls getDeploymentStatus itself from there.
async function pollDeployment(deploymentId, maxWaitMs = 45000, intervalMs = 3000) {
  const deadline = Date.now() + maxWaitMs;
  let last = await getDeployment(deploymentId);
  while (mapReadyState(last.readyState) === 'BUILDING' && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, intervalMs));
    last = await getDeployment(deploymentId);
  }
  return last;
}

module.exports = { ensureVercelProject, createProductionDeployment, getDeployment, pollDeployment, mapReadyState };
