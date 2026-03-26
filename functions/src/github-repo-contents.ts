import { onCall, HttpsError } from 'firebase-functions/v2/https';

export const githubRepoContents = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required');
  const { owner, repo, path = '' } = request.data;
  const GITHUB_TOKEN = process.env.GITHUB_ACCESS_TOKEN;

  if (!GITHUB_TOKEN) throw new HttpsError('internal', 'GitHub token not configured');

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to fetch' }));
    throw new HttpsError('internal', err.message || 'Failed to fetch repository contents');
  }

  return await response.json();
});
