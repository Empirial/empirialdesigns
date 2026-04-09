import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

export const aiChat = onRequest({
  timeoutSeconds: 540,
  memory: '1GiB',
  cors: true
}, async (req, res) => {
  // Set CORS headers
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return; }

  try {
    const { messages, repoOwner, repoName, repoId, selectedFiles } = req.body;
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const GITHUB_TOKEN = process.env.GITHUB_ACCESS_TOKEN;
    const authHeader = req.headers.authorization;

    if (!OPENROUTER_API_KEY) {
      res.status(500).json({ error: 'AI service not configured' }); return;
    }
    if (!authHeader) {
      res.status(401).json({ error: 'Authentication required' }); return;
    }

    // Verify Firebase ID token
    const token = authHeader.replace('Bearer ', '');
    let uid: string;
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      uid = decoded.uid;
    } catch (e) {
      res.status(401).json({ error: 'Authentication failed' }); return;
    }

    const db = admin.firestore();
    const lastUserMessage = messages[messages.length - 1]?.content || '';

    const models = ['deepseek-chat'];

    // Fetch repo structure from GitHub
    async function fetchRepoStructure(path = '', maxDepth = 3, depth = 0): Promise<any[]> {
      if (depth >= maxDepth || !GITHUB_TOKEN) return [];
      try {
        const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`;
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' },
        });
        if (!response.ok) return [];
        const items = await response.json();
        const structure: any[] = [];
        for (const item of items) {
          if (item.type === 'file') {
            structure.push({ type: 'file', path: item.path, name: item.name, size: item.size });
          } else if (item.type === 'dir' && depth < maxDepth - 1) {
            const sub = await fetchRepoStructure(item.path, maxDepth, depth + 1);
            structure.push({ type: 'dir', path: item.path, name: item.name });
            structure.push(...sub);
          }
        }
        return structure;
      } catch { return []; }
    }

    let codeContext = '';
    let repositoryStructure: any[] = [];
    const relevantFiles: Record<string, string> = {};

    if (repoOwner && repoName) {
      try {
        if (repoId) {
          const repoDoc = await db.collection('users').doc(uid).collection('repos').doc(repoId).get();
          const repoData = repoDoc.data();
          if (repoData?.repoStructure?.length > 0) {
            repositoryStructure = repoData.repoStructure;
          } else if (GITHUB_TOKEN) {
            repositoryStructure = await fetchRepoStructure();
            if (repositoryStructure.length > 0) {
              await db.collection('users').doc(uid).collection('repos').doc(repoId).update({ repoStructure: repositoryStructure });
            }
          }
        } else if (GITHUB_TOKEN) {
          repositoryStructure = await fetchRepoStructure();
        }

        const structureSummary = repositoryStructure.filter(i => i.type === 'file').map(i => i.path).slice(0, 50);
        codeContext = `\n\nRepository Structure (${structureSummary.length} files):\n${structureSummary.join('\n')}`;

        const messageLower = lastUserMessage.toLowerCase();
        let relevantPaths: string[] = selectedFiles?.length > 0 ? selectedFiles : [];

        if (relevantPaths.length === 0) {
          const patterns: Record<string, string[]> = {
            price: ['pricing', 'price', 'hero'], button: ['button'], form: ['form', 'contact'],
            header: ['header', 'nav'], footer: ['footer'], theme: ['theme', 'css', 'style'],
          };
          for (const [kw, pats] of Object.entries(patterns)) {
            if (messageLower.includes(kw)) {
              for (const pat of pats) {
                relevantPaths.push(...repositoryStructure.filter(i => i.type === 'file' && i.path.toLowerCase().includes(pat)).map(i => i.path).slice(0, 3));
              }
            }
          }
        }

        if (relevantPaths.length === 0) {
          relevantPaths = repositoryStructure.filter(i => i.type === 'file' && (i.path.includes('Hero') || i.path.includes('App') || i.path.includes('index'))).map(i => i.path).slice(0, 5);
        }

        for (const filePath of [...new Set(relevantPaths)].slice(0, 5)) {
          try {
            const fileUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;
            const fileResponse = await fetch(fileUrl, { headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' } });
            if (fileResponse.ok) {
              const fileData = await fileResponse.json();
              if (fileData.content && fileData.encoding === 'base64') {
                relevantFiles[filePath] = Buffer.from(fileData.content, 'base64').toString('utf8');
              }
            }
          } catch {}
        }

        if (Object.keys(relevantFiles).length > 0) {
          codeContext += '\n\nRelevant File Contents:\n';
          for (const [path, content] of Object.entries(relevantFiles)) {
            codeContext += `\n--- File: ${path} ---\n${content.substring(0, 2000)}\n`;
          }
        }
      } catch (e) { console.log('Could not fetch repo contents:', e); }
    }

    const systemPrompt = `You are Empirial, an expert AI assistant specializing in web development and GitHub repository management.

Your capabilities:
- Analyze and understand code repositories
- Generate precise code changes and improvements
- Commit code changes directly to GitHub when requested

${codeContext}

WORKFLOW: When asked to make changes, identify the files, provide COMPLETE file content in code blocks with paths:

\`\`\`tsx path=src/components/Hero.tsx
[complete file content]
\`\`\`

CRITICAL: Always provide the COMPLETE file with your changes.`;

    // Try models
    let aiResponse: Response | undefined;
    for (const model of models) {
      try {
        const r = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ model, messages: [{ role: 'system', content: systemPrompt }, ...messages], stream: true }),
        });
        if (r.ok) { aiResponse = r; break; }
      } catch {}
    }

    if (!aiResponse?.ok) { res.status(500).json({ error: 'AI service unavailable' }); return; }

    // Stream response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullResponse = '';
    let lastCommitUrl = '';
    const reader = aiResponse.body?.getReader();
    if (!reader) { res.status(500).json({ error: 'No response body' }); return; }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim() || line.startsWith(':')) continue;
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim();
          if (dataStr === '[DONE]') continue;
          try {
            const data = JSON.parse(dataStr);
            const content = data.choices?.[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              res.write(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`);
            }
          } catch {}
        }
      }
    }

    // Extract and commit code changes
    if (repoOwner && repoName && GITHUB_TOKEN && fullResponse.includes('```')) {
      res.write(`data: ${JSON.stringify({ type: 'tool_call', id: 'commit_1', name: 'commit_code', status: 'running' })}\n\n`);

      const changes: Array<{ path: string; content: string }> = [];

      const fenceRegex = /```([^\n]*)\n([\s\S]*?)```/g;
      let fenceMatch;
      while ((fenceMatch = fenceRegex.exec(fullResponse)) !== null) {
        const info = fenceMatch[1];
        const content = fenceMatch[2];
        const pm = info.match(/(?:path|file|filename)=([^\s]+)/i);
        if (pm) changes.push({ path: pm[1], content });
      }

      for (const change of changes) {
        try {
          const fileUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${change.path}`;
          let sha = '';
          const existing = await fetch(fileUrl, { headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' } });
          if (existing.ok) { sha = (await existing.json()).sha || ''; }

          const commitRes = await fetch(fileUrl, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `AI Edit: ${lastUserMessage.slice(0, 50)} (${change.path})`, content: Buffer.from(change.content).toString('base64'), ...(sha && { sha }) }),
          });

          if (commitRes.ok) {
            const commitData = await commitRes.json();
            lastCommitUrl = commitData.commit?.html_url || '';
            res.write(`data: ${JSON.stringify({ type: 'tool_call', id: `commit_${change.path}`, name: 'commit_file', status: 'complete', output: { path: change.path, url: lastCommitUrl } })}\n\n`);
            res.write(`data: ${JSON.stringify({ type: 'commit', url: lastCommitUrl, path: change.path })}\n\n`);

            if (repoId) {
              await db.collection('users').doc(uid).collection('editLogs').add({
                repoId, filePath: change.path, prompt: lastUserMessage,
                changesMade: 'AI generated code changes', createdAt: admin.firestore.FieldValue.serverTimestamp(),
              });
            }
          }
        } catch (e) { console.error(`Failed to commit ${change.path}:`, e); }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Error in aiChat:', error);
    res.status(500).json({ error: error.message || 'Unknown error' });
  }
});
