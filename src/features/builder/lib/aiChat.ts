// Real aiChat Cloud Function wiring, ported from the (now-retired) Preview.tsx's
// handleSend/applyAiChangesToSandpack. NOT YET VERIFIED against a live deploy —
// functions/index.js's aiChat requires OPENROUTER_API_KEY to be configured as a
// Cloud Function secret/env var; if it isn't, calls here will fail with a clear
// error (see the `if (!response.ok)` check below) rather than failing silently.
import type { SandpackFiles } from '@/features/repositories/lib/repos.service';

const FIREBASE_FUNCTION_URL = 'https://us-central1-empirialdesigns.cloudfunctions.net';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Streams a chat completion from the real aiChat Cloud Function, reporting
 * incremental content back via onDelta as it arrives. Throws on auth failure,
 * a non-2xx response, or a missing response body — callers should catch and
 * surface the error rather than swallow it.
 */
export async function streamAiChat(
  idToken: string,
  { repoOwner, repoName, history }: { repoOwner: string; repoName: string; history: ChatTurn[] },
  onDelta: (fullContentSoFar: string) => void
): Promise<string> {
  const response = await fetch(`${FIREBASE_FUNCTION_URL}/aiChat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ messages: history, repoOwner, repoName }),
  });

  if (!response.ok) {
    let detail = '';
    try { detail = (await response.json())?.error || ''; } catch { /* body wasn't JSON */ }
    throw new Error(detail || `AI request failed (${response.status}). The aiChat function may not be configured yet.`);
  }
  if (!response.body) throw new Error('No response body from the AI.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let content = '';
  let done = false;

  while (!done) {
    const { done: readerDone, value } = await reader.read();
    if (readerDone) { done = true; break; }
    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split('\n')) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        try {
          const json = JSON.parse(line.slice(6));
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) { content += delta; onDelta(content); }
        } catch { /* ignore partial/keepalive lines that aren't valid JSON yet */ }
      }
    }
  }

  return content;
}

/**
 * Strips <file path="...">...</file> blocks out of a (possibly still-streaming)
 * AI response, leaving only the natural-language reply meant for the chat
 * bubble — the raw code was never meant to be read by the user, just applied
 * to the project (see parseAiFileBlocks below). A complete block is removed
 * outright; a block the model is still mid-write on (no closing </file> yet)
 * is cut off entirely rather than leaking its partial raw code into view.
 */
export function stripFileBlocksForDisplay(aiContent: string): string {
  const withoutCompleteBlocks = aiContent.replace(/<file\s+path="[^"]*">[\s\S]*?<\/file>/g, '').trim();
  const openTagIndex = withoutCompleteBlocks.indexOf('<file ');
  return (openTagIndex === -1 ? withoutCompleteBlocks : withoutCompleteBlocks.slice(0, openTagIndex)).trim();
}

/** Parses <file path="...">...</file> blocks out of an AI response into a Sandpack-ready file map. */
export function parseAiFileBlocks(aiContent: string): { files: SandpackFiles; changedCount: number } {
  const fileRegex = /<file\s+path="([^"]+)">([\s\S]*?)<\/file>/g;
  const files: SandpackFiles = {};
  let match: RegExpExecArray | null;
  let changedCount = 0;

  while ((match = fileRegex.exec(aiContent)) !== null) {
    const path = match[1].trim();
    const content = match[2].trim();
    const absolutePath = path.startsWith('/') ? path : '/' + path;
    files[absolutePath] = { code: content };
    changedCount++;
  }

  return { files, changedCount };
}
