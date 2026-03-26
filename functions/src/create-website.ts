import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

function detectWebsiteType(message: string) {
  const msg = message.toLowerCase();
  let type: string = 'landing';
  if (msg.includes('shop') || msg.includes('store') || msg.includes('ecommerce')) type = 'ecommerce';
  else if (msg.includes('blog') || msg.includes('article')) type = 'blog';
  else if (msg.includes('portfolio') || msg.includes('showcase')) type = 'portfolio';
  else if (msg.includes('saas') || msg.includes('software')) type = 'saas';
  else if (msg.includes('restaurant') || msg.includes('food')) type = 'restaurant';

  let style = 'modern';
  if (msg.includes('minimal')) style = 'minimal';
  if (msg.includes('corporate') || msg.includes('business')) style = 'corporate';
  if (msg.includes('creative')) style = 'creative';

  const features: string[] = [];
  if (msg.includes('pricing')) features.push('pricing');
  if (msg.includes('contact') || msg.includes('form')) features.push('contact');
  if (msg.includes('testimonial')) features.push('testimonials');
  if (msg.includes('about')) features.push('about');

  return { type, style, features };
}

export const createWebsite = onCall({ timeoutSeconds: 540, memory: '1GiB' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required');
  const uid = request.auth.uid;
  const { prompt, repoName: providedRepoName, websiteType, companyName } = request.data;

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  const GITHUB_TOKEN = process.env.GITHUB_ACCESS_TOKEN;

  if (!OPENROUTER_API_KEY) throw new HttpsError('internal', 'OPENROUTER_API_KEY not configured');
  if (!GITHUB_TOKEN) throw new HttpsError('internal', 'GITHUB_TOKEN not configured');

  const detected = detectWebsiteType(prompt);
  const repoName = providedRepoName || `${detected.type}-website-${Date.now().toString().slice(-6)}`;

  // Create GitHub repo
  const createRepoRes = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: repoName, description: `AI-generated ${detected.type} website`, private: false, auto_init: false }),
  });

  if (!createRepoRes.ok) {
    const err = await createRepoRes.json().catch(() => ({ message: 'Unknown error' }));
    throw new HttpsError('internal', err.message || 'Failed to create repository');
  }

  const repoData = await createRepoRes.json();
  const repoOwner = repoData.owner.login;

  // Generate website with AI
  const systemPrompt = `You are an expert web developer. Generate a complete ${detected.type} website (React + TypeScript + Vite + Tailwind). Style: ${detected.style}. Company: ${companyName || 'My Company'}. Features: ${detected.features.join(', ') || 'basic'}.

Provide ALL files with this format:
\`\`\`json path=package.json
[content]
\`\`\`

Include: package.json, vite.config.ts, tsconfig.json, index.html, src/main.tsx, src/App.tsx, src/index.css, components. Make it complete and working.`;

  const models = ['deepseek/deepseek-r1-0528', 'deepseek/deepseek-r1', 'google/gemini-pro', 'mistralai/mistral-large'];
  let aiResponse = '';

  for (const model of models) {
    try {
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}`, 'HTTP-Referer': 'https://empirialdesigns.co.za', 'X-Title': 'Empirial Designs', 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }] }),
      });
      if (r.ok) {
        const data = await r.json();
        aiResponse = data.choices[0]?.message?.content || '';
        break;
      }
    } catch {}
  }

  if (!aiResponse) throw new HttpsError('internal', 'Failed to generate website. Please try again.');

  // Extract files
  const fileRegex = /```(\w+)?\s*(?:path|file|filename)=([^\n]+)\n([\s\S]*?)```/g;
  const files: Array<{ path: string; content: string }> = [];
  let match;
  while ((match = fileRegex.exec(aiResponse)) !== null) {
    const path = match[2].trim();
    const content = match[3].trim();
    if (path && content) files.push({ path, content });
  }

  if (files.length === 0) throw new HttpsError('internal', 'No files generated. Please try again with a more specific prompt.');

  // Create blobs and commit to GitHub
  const defaultBranch = repoData.default_branch || 'main';
  const blobs = [];

  for (const file of files) {
    if (!file.content.trim()) continue;
    const blobRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/git/blobs`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: Buffer.from(file.content).toString('base64'), encoding: 'base64' }),
    });
    if (blobRes.ok) {
      const blob = await blobRes.json();
      blobs.push({ path: file.path, sha: blob.sha, mode: '100644', type: 'blob' });
    }
  }

  if (blobs.length === 0) throw new HttpsError('internal', 'Failed to upload files to GitHub');

  const treeRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/git/trees`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ base_tree: null, tree: blobs }),
  });
  if (!treeRes.ok) throw new HttpsError('internal', 'Failed to create file tree');
  const tree = await treeRes.json();

  const commitRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/git/commits`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Initial commit: AI-generated website', tree: tree.sha, parents: [] }),
  });
  if (!commitRes.ok) throw new HttpsError('internal', 'Failed to create commit');
  const commit = await commitRes.json();

  // Update branch ref
  try {
    const refRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/git/refs/heads/${defaultBranch}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ sha: commit.sha, force: true }),
    });
    if (!refRes.ok) {
      await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/git/refs`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: `refs/heads/${defaultBranch}`, sha: commit.sha }),
      });
    }
  } catch {}

  // Store in Firestore
  const structure = files.map(f => ({ type: 'file', path: f.path, name: f.path.split('/').pop() || f.path }));
  const db = admin.firestore();
  const repoDocRef = await db.collection('users').doc(uid).collection('repos').add({
    repoUrl: repoData.html_url,
    repoOwner,
    repoName,
    repoStructure: structure,
    templateType: detected.type,
    generationPrompt: prompt,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    repo: {
      id: repoDocRef.id,
      name: repoName,
      owner: repoOwner,
      url: repoData.html_url,
      files_created: files.length,
      commit_url: commit.html_url,
    },
  };
});
