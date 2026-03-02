/// <reference path="../deno.d.ts" />

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, repoOwner, repoName, repoId, selectedFiles } = await req.json();
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    const GITHUB_TOKEN = Deno.env.get('GITHUB_ACCESS_TOKEN');
    const authHeader = req.headers.get('Authorization');

    if (!OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY not configured');
      return new Response(JSON.stringify({ 
        error: 'AI service not configured',
        details: 'The AI service is not properly set up. Please contact support.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(JSON.stringify({ 
        error: 'Authentication required',
        details: 'Please sign in to use the AI assistant.' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Define models in order of preference (fallback)
    const models = [
      'deepseek/deepseek-r1-0528',      // Primary choice - most capable
      'deepseek/deepseek-r1',    // First fallback - good balance
      'google/gemini-pro',            // Second fallback
      'mistralai/mistral-large'       // Final fallback
    ];

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(JSON.stringify({ 
        error: 'Authentication failed',
        details: 'Your session has expired. Please sign in again.' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`AI chat request from user: ${user.id}, repo: ${repoOwner}/${repoName}`);

    // Get last user message
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    
    // Detect if this is a generation request (no repo exists)
    const isGenerationRequest = !repoId && (
      lastUserMessage.toLowerCase().includes('create') ||
      lastUserMessage.toLowerCase().includes('build') ||
      lastUserMessage.toLowerCase().includes('generate') ||
      lastUserMessage.toLowerCase().includes('make me a') ||
      lastUserMessage.toLowerCase().includes('new website') ||
      lastUserMessage.toLowerCase().includes('build me a')
    );

    // If generation request detected, return instruction to use create-website endpoint
    if (isGenerationRequest) {
      return new Response(JSON.stringify({
        requires_generation: true,
        message: 'This appears to be a request to create a new website. Please use the website generator or provide a repository to edit.',
        suggestion: 'Use the "Generate Website" feature to create a new website from scratch.',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Helper function to recursively fetch repository structure from GitHub
    async function fetchRepoStructureFromGitHub(path: string = '', maxDepth: number = 3, currentDepth: number = 0): Promise<any[]> {
      if (currentDepth >= maxDepth || !GITHUB_TOKEN) return [];
      
      try {
        const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`;
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        });

        if (!response.ok) return [];

        const items = await response.json();
        const structure: any[] = [];

        for (const item of items) {
          if (item.type === 'file') {
            structure.push({
              type: 'file',
              path: item.path,
              name: item.name,
              size: item.size,
            });
          } else if (item.type === 'dir' && currentDepth < maxDepth - 1) {
            const subItems = await fetchRepoStructureFromGitHub(item.path, maxDepth, currentDepth + 1);
            structure.push({
              type: 'dir',
              path: item.path,
              name: item.name,
            });
            structure.push(...subItems);
          }
        }
        return structure;
      } catch (e) {
        console.log(`Error fetching ${path}:`, e);
        return [];
      }
    }

    // Fetch repository structure and relevant files
    let codeContext = '';
  // repositoryStructure is populated from GitHub API responses; keep as `any[]` intentionally
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let repositoryStructure: any[] = [];
  // 'relevantFiles' is mutated but never reassigned — use const
  const relevantFiles: Record<string, string> = {};

    if (repoOwner && repoName) {
      try {
        // FIRST: Try to get cached structure from database if repoId is provided
        if (repoId) {
          console.log('Checking for cached repository structure...');
          const { data: repoData } = await supabaseClient
            .from('user_repos')
            .select('repo_structure')
            .eq('id', repoId)
            .eq('user_id', user.id)
            .single();

          if (repoData?.repo_structure && Array.isArray(repoData.repo_structure) && repoData.repo_structure.length > 0) {
            repositoryStructure = repoData.repo_structure;
            console.log(`Using cached structure: ${repositoryStructure.length} items`);
          } else {
            console.log('No cached structure found, fetching from GitHub...');
            if (GITHUB_TOKEN) {
              repositoryStructure = await fetchRepoStructureFromGitHub('', 3, 0);
              
              // Cache it for future use
              if (repositoryStructure.length > 0) {
                await supabaseClient
                  .from('user_repos')
                  .update({ repo_structure: repositoryStructure })
                  .eq('id', repoId)
                  .eq('user_id', user.id);
                console.log(`Cached ${repositoryStructure.length} items for future use`);
              }
            }
          }
        } else if (GITHUB_TOKEN) {
          // Fallback: fetch directly from GitHub if no repoId
          console.log('No repoId provided, fetching structure from GitHub...');
          repositoryStructure = await fetchRepoStructureFromGitHub('', 3, 0);
        }
        
        // Create a readable structure summary
        const structureSummary = repositoryStructure
          .filter(item => item.type === 'file')
          .map(item => item.path)
          .slice(0, 50); // Limit to first 50 files to avoid token limit

        codeContext = `\n\nRepository Structure (${structureSummary.length} files):\n${structureSummary.join('\n')}`;

        // Try to fetch relevant files based on user message
        const messageLower = lastUserMessage.toLowerCase();
        const isWebsiteWideChange = 
          messageLower.includes('entire website') ||
          messageLower.includes('whole website') ||
          messageLower.includes('redesign') ||
          messageLower.includes('change theme') ||
          messageLower.includes('website theme') ||
          messageLower.includes('all pages') ||
          messageLower.includes('create website') ||
          messageLower.includes('build website') ||
          messageLower.includes('new website');

        const commonPatterns: Record<string, string[]> = {
          price: ['pricing', 'price', 'cost', 'amount', 'hero', 'components'],
          website: ['app', 'main', 'index', 'home', 'page'],
          button: ['button', 'btn', 'component'],
          form: ['form', 'input', 'contact'],
          header: ['header', 'nav', 'navbar'],
          footer: ['footer'],
          product: ['product', 'item', 'card'],
          theme: ['theme', 'color', 'style', 'css', 'styling'],
          design: ['design', 'layout', 'ui', 'appearance'],
        };

        // Find files that might be relevant
        let relevantPaths: string[] = [];
        
        // If user selected specific files, use those as the primary context
        if (selectedFiles && Array.isArray(selectedFiles) && selectedFiles.length > 0) {
          console.log(`User selected ${selectedFiles.length} files explicitly`);
          relevantPaths = selectedFiles;
        } else {
          // Otherwise, use automatic file detection
          relevantPaths = [];
        }
        // Only do pattern matching if user didn't select files
        if (relevantPaths.length === 0) {
          for (const [keyword, patterns] of Object.entries(commonPatterns)) {
            if (messageLower.includes(keyword)) {
              for (const pattern of patterns) {
                const matching = repositoryStructure
                  .filter(item => item.type === 'file' && 
                    (item.name.toLowerCase().includes(pattern) || 
                     item.path.toLowerCase().includes(pattern)))
                  .map(item => item.path)
                  .slice(0, 3);
                relevantPaths.push(...matching);
              }
            }
          }
        }

        // For website-wide changes, fetch more comprehensive file set (only if no files selected)
        if (isWebsiteWideChange && relevantPaths.length === 0) {
          console.log('Detected website-wide change, fetching comprehensive file set...');
          const websiteFiles = repositoryStructure
            .filter(item => item.type === 'file' && 
              (item.path.includes('App') || 
               item.path.includes('index') ||
               item.path.includes('main') ||
               item.path.includes('Home') ||
               item.path.includes('component') ||
               item.path.includes('css') ||
               item.path.includes('style') ||
               item.path.endsWith('.tsx') ||
               item.path.endsWith('.ts') ||
               item.path.endsWith('.css')))
            .map(item => item.path)
            .slice(0, 15); // Fetch up to 15 files for major changes
          relevantPaths.push(...websiteFiles);
        }

        // Also look for common component/page files if no matches yet
        if (relevantPaths.length === 0) {
          const commonFiles = repositoryStructure
            .filter(item => item.type === 'file' && 
              (item.path.includes('Hero') || 
               item.path.includes('App') || 
               item.path.includes('index') ||
               item.path.includes('main') ||
               item.path.includes('Home')))
            .map(item => item.path)
            .slice(0, 5);
          relevantPaths.push(...commonFiles);
        }

        // Fetch contents of relevant files (more for website-wide changes)
        const maxFilesToFetch = isWebsiteWideChange ? 10 : 5;
        console.log(`Fetching ${relevantPaths.length} relevant files...`);
        for (const filePath of [...new Set(relevantPaths)].slice(0, maxFilesToFetch)) {
          try {
            const fileUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;
            const fileResponse = await fetch(fileUrl, {
              headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
              },
            });
            
            if (fileResponse.ok) {
              const fileData = await fileResponse.json();
              if (fileData.content && fileData.encoding === 'base64') {
                try {
                  relevantFiles[filePath] = atob(fileData.content);
                  console.log(`Fetched: ${filePath} (${relevantFiles[filePath].length} chars)`);
                } catch (e) {
                  console.log(`Error decoding ${filePath}:`, e);
                }
              }
            }
          } catch (e) {
            console.log(`Could not fetch ${filePath}:`, e);
          }
        }

        // Add relevant file contents to context
        if (Object.keys(relevantFiles).length > 0) {
          codeContext += '\n\nRelevant File Contents:\n';
          for (const [path, content] of Object.entries(relevantFiles)) {
            codeContext += `\n--- File: ${path} ---\n${content.substring(0, 2000)}\n`;
          }
        }
      } catch (e) {
        console.log('Could not fetch repo contents:', e);
      }
    }

    const systemPrompt = `You are Empirial, an expert AI assistant specializing in web development and GitHub repository management.

Your capabilities:
- Analyze and understand code repositories
- Generate precise code changes and improvements
- Help with debugging and optimization
- Provide clear explanations and best practices
- Commit code changes directly to GitHub when requested
- Reason about code structure and find files based on user requests
- Create or modify entire websites from a single prompt

${codeContext}

${selectedFiles && selectedFiles.length > 0 ? `\n\nUSER-SELECTED FILES FOR EDITING:\nThe user has explicitly selected these files to edit: ${selectedFiles.join(', ')}\nFocus your changes on these specific files unless the request requires modifying additional files.\n` : ''}

WORKFLOW FOR HANDLING USER REQUESTS:

1. UNDERSTAND THE REQUEST:
   - When a user asks to change something, analyze the FULL SCOPE of the request
   - For website-wide changes (e.g., "make my website blue", "redesign my homepage", "add a new section"):
     * Identify ALL files that need to be modified
     * Consider styling files, components, pages, and configuration files
     * Think comprehensively about the entire change
   - For specific changes (e.g., "change the price"): identify the specific file(s)
   - Look at the repository structure and relevant file contents provided above
   - Use reasoning to determine which file(s) likely contain the code to modify

2. FIND THE RIGHT FILES:
   - Search through the repository structure for files that match the request
   - For website-wide changes, you may need to modify MULTIPLE files:
     * Component files (src/components/*)
     * Page files (src/pages/*, src/App.tsx)
     * Styling files (src/index.css, src/styles.css, tailwind.config.js)
     * Configuration files if needed
   - For "price" changes: look for files with "price", "pricing", "hero", "product"
   - For UI/styling changes: look for component files, page files, CSS/styling files
   - Use the file contents provided above, or reference files from the structure list
   - If the file isn't in the provided context, use common patterns:
     * React components: src/components/, src/pages/
     * Main app: src/App.tsx, src/main.tsx, src/index.tsx
     * Styling: src/index.css, src/styles.css, tailwind.config.js
     * Configuration: package.json, vite.config.ts

3. PROVIDE COMPLETE CODE:
   - For website-wide changes: Provide ALL modified files in separate code blocks
   - Always provide the FULL file content with your changes, not just snippets
   - Use the exact file path from the repository structure
   - Include all necessary imports and context
   - You can provide multiple files in one response - each will be automatically committed

4. FORMAT FOR AUTO-COMMIT:
   When you provide code that should be committed, format each file EXACTLY like this:

\`\`\`tsx path=src/components/Hero.tsx
[complete file content here]
\`\`\`

\`\`\`css path=src/index.css
[complete file content here]
\`\`\`

Or use any of these formats:
- \`\`\`tsx path=src/file.tsx
- \`\`\`jsx file=src/file.jsx
- \`\`\`ts filename=src/file.ts
- \`\`\`css path=src/styles.css

You can also add a comment at the start:
\`\`\`tsx
// file: src/components/Hero.tsx
[code here]
\`\`\`

CRITICAL: 
- Always provide the COMPLETE file with your changes. The system will replace the entire file, so missing code will break the application!
- For website-wide changes, provide ALL files that need modification in separate code blocks - the system will commit all of them automatically!

EXAMPLES:

Example 1 - Simple change:
User: "Change the price on my website to $99"
You should:
1. Identify this is likely in a Hero, Pricing, or Product component
2. Check the relevant files provided above
3. Find where the price is displayed (look for numbers, "price", "$", etc.)
4. Provide the COMPLETE file with the price changed to $99
5. Format: \`\`\`tsx path=src/components/Hero.tsx\n[full file with $99]\n\`\`\`

Example 2 - Website-wide change:
User: "Change my website theme to blue"
You should:
1. Identify ALL files that affect the theme/styling:
   - Main styling file (src/index.css or src/styles.css)
   - Component files that might have inline styles
   - Tailwind config if using Tailwind
   - App.tsx if theme is set there
2. Provide MULTIPLE code blocks, one for each file:
   \`\`\`css path=src/index.css\n[full CSS with blue theme]\n\`\`\`
   \`\`\`tsx path=src/App.tsx\n[full App with blue theme]\n\`\`\`
3. All files will be automatically committed!

Example 3 - Create new website:
User: "Create a landing page for my business"
You should:
1. Identify what files need to be created/modified:
   - New component: src/components/LandingPage.tsx
   - Update App.tsx to use it
   - Add styling if needed
2. Provide ALL files needed:
   \`\`\`tsx path=src/components/LandingPage.tsx\n[complete landing page code]\n\`\`\`
   \`\`\`tsx path=src/App.tsx\n[updated App using LandingPage]\n\`\`\`
3. The system will create/update all files automatically!`;

    // Try models in sequence until one works
    let response;
    let currentModelIndex = 0;
    let lastError;

    while (currentModelIndex < models.length) {
      const currentModel = models[currentModelIndex];
      try {
        response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://empirialdesigns.co.za',  // Your website URL
            'X-Title': 'Empirial Designs',  // Your app name
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: currentModel,
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages
            ],
            stream: true,
          }),
        });

        if (response.ok) {
          break; // Success! Exit the loop
        }

        // Store the error and try next model
        lastError = await response.text();
        currentModelIndex++;
        
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error occurred';
        currentModelIndex++;
        continue;
      }
    }

    // If we've tried all models and none worked
    if (!response || !response.ok) {
      const status = response?.status || 500;
      let errorMessage = 'AI service unavailable';
      let errorDetails = 'The AI service is currently unavailable. Please try again later.';

      if (status === 429) {
        errorMessage = 'Rate limit exceeded';
        errorDetails = 'Too many requests. Please wait a moment before trying again.';
      } else if (status === 402) {
        errorMessage = 'Payment required';
        errorDetails = 'AI service credits depleted. Please contact support.';
      } else if (status === 401 || status === 403) {
        errorMessage = 'API authentication failed';
        errorDetails = 'The AI service authentication failed. Please contact support.';
      }

      console.error('AI gateway error:', {
        status,
        lastError,
        model: models[currentModelIndex - 1] || 'unknown'
      });

      return new Response(JSON.stringify({ 
        error: errorMessage,
        details: errorDetails 
      }), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Stream the AI response and try to commit code changes if detected
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let lastCommitUrl = '';

    // ---- Helpers: extract proposed changes from response ----
    type ProposedChange = { path: string; content: string };

    function looksLikePath(value: string): boolean {
      // heuristic: looks like a file path
      // Must contain a slash (directory structure) OR be a common file pattern
      if (/\//.test(value)) {
        // Has directory structure - good sign
        return true;
      }
      // Or starts with common prefixes and has extension
      if (/^(src|components|pages|utils|lib|public|app)\//.test(value)) {
        return true;
      }
      // Or has file extension and looks reasonable
      if (/\.[a-zA-Z0-9]+$/.test(value) && value.length > 3 && value.length < 200) {
        return true;
      }
      return false;
    }

    function extractPathFromInfoString(info: string): string | '' {
      const parts = info.trim().split(/\s+/);
      // Look for path=, file=, or filename= in various formats
      for (const part of parts) {
        // Match: path=src/file.tsx, file=src/file.tsx, filename=src/file.tsx
        const m = part.match(/^(?:path|file|filename)=([^\s=]+)$/i);
        if (m && looksLikePath(m[1])) return m[1];
        
        // Match: path="src/file.tsx" or path='src/file.tsx'
        const m2 = part.match(/^(?:path|file|filename)=["']([^"']+)["']$/i);
        if (m2 && looksLikePath(m2[1])) return m2[1];
      }
      // If any token itself looks like a path (e.g., tsx src/components/Hero.tsx)
      // Skip the first part as it's usually the language identifier
      for (let i = 1; i < parts.length; i++) {
        if (looksLikePath(parts[i])) return parts[i];
      }
      return '';
    }

    function extractPathFromCodePreamble(code: string): string | '' {
      // Check first few lines for comments like: // file: src/x.ts, /* file: src/x */, # file: src/x
      const firstLines = code.split(/\r?\n/).slice(0, 5);
      for (const line of firstLines) {
        const m = line.match(/(?:\/\/|#|<!--|\*)\s*file:\s*([^\s>]+)\s*(?:-->)?/i);
        if (m && looksLikePath(m[1])) return m[1];
        const m2 = line.match(/(?:\/\/|#|<!--|\*)\s*path:\s*([^\s>]+)\s*(?:-->)?/i);
        if (m2 && looksLikePath(m2[1])) return m2[1];
      }
      return '';
    }

    function extractProposedChanges(text: string): ProposedChange[] {
      const changes: ProposedChange[] = [];
      const fenceRegex = /```([^\n]*)\n([\s\S]*?)```/g; // info string + code
      let match: RegExpExecArray | null;
      while ((match = fenceRegex.exec(text)) !== null) {
        const info = match[1] || '';
        const code = match[2] || '';
        let path = extractPathFromInfoString(info);
        if (!path) path = extractPathFromCodePreamble(code);

        if (path) {
          changes.push({ path, content: code });
        }
      }
      return changes;
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let buffer = '';
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            fullResponse += chunk;

            // Parse SSE format from OpenRouter
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
              if (line.trim() === '' || line.startsWith(':')) continue;
              
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6).trim();
                if (dataStr === '[DONE]') {
                  continue;
                }
                
                try {
                  const data = JSON.parse(dataStr);
                  const content = data.choices?.[0]?.delta?.content;
                  
                  if (content) {
                    // Forward content delta to client
                    const sseLine = `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;
                    controller.enqueue(encoder.encode(sseLine));
                  }
                } catch (e) {
                  // If not JSON, might be raw text - forward as-is
                  const sseLine = `data: ${dataStr}\n\n`;
                  controller.enqueue(encoder.encode(sseLine));
                }
              } else {
                // Forward non-data lines as-is
                controller.enqueue(encoder.encode(line + '\n'));
              }
            }
          }

          // Process any remaining buffer
          if (buffer.trim()) {
            try {
              const data = JSON.parse(buffer.startsWith('data: ') ? buffer.slice(6) : buffer);
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                const sseLine = `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;
                controller.enqueue(encoder.encode(sseLine));
              }
            } catch (e) {
              // Ignore parsing errors for remaining buffer
            }
          }

           // After streaming completes, check if we should commit code
          if (repoOwner && repoName && GITHUB_TOKEN && fullResponse.includes('```')) {
            console.log('Detected code blocks in response, attempting to commit...');
            
            // Send tool call start event
            const toolStartEvent = `data: ${JSON.stringify({ type: 'tool_call', id: 'commit_1', name: 'commit_code', status: 'running' })}\n\n`;
            controller.enqueue(encoder.encode(toolStartEvent));
            
            try {
              const proposed = extractProposedChanges(fullResponse);
              console.log(`Extracted ${proposed.length} code changes from response`);

              if (proposed.length === 0) {
                console.log('No explicit paths found, trying fallback detection...');
                // fallback to previous heuristic if no explicit paths found
                const fallbackRegex = /```(\w+)?\n([\s\S]*?)```/;
                const m = fullResponse.match(fallbackRegex);
                if (m) {
                  const language = (m[1] || '').trim();
                  const code = m[2] || '';
                  
                  // Try to infer path from context or use sensible default
                  let fileName = 'README.md';
                  if (language === 'tsx' || language === 'jsx') {
                    fileName = 'src/App.tsx';
                  } else if (language === 'ts' || language === 'js') {
                    fileName = 'src/index.ts';
                  } else if (language === 'python') {
                    fileName = 'main.py';
                  }
                  
                  console.log(`Fallback commit attempt for ${fileName}`);

                  const fileUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${fileName}`;
                  let sha = '';
                  try {
                    const fileResponse = await fetch(fileUrl, {
                      headers: {
                        'Authorization': `Bearer ${GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json',
                      },
                    });
                    if (fileResponse.ok) {
                      const fileData = await fileResponse.json();
                      sha = fileData.sha || '';
                    }
                  } catch (e) {
                    console.log('Could not fetch existing file SHA:', e);
                  }

                  const commitResponse = await fetch(fileUrl, {
                    method: 'PUT',
                    headers: {
                      'Authorization': `Bearer ${GITHUB_TOKEN}`,
                      'Accept': 'application/vnd.github.v3+json',
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      message: `AI Edit: ${lastUserMessage.slice(0, 50)}`,
                      content: btoa(code),
                      ...(sha && { sha }),
                    }),
                  });

                  if (commitResponse.ok) {
                    const commitData = await commitResponse.json();
                    lastCommitUrl = commitData.commit?.html_url || '';
                    console.log('Successfully committed:', fileName, lastCommitUrl);
                    
                    // Send tool complete event
                    const toolCompleteEvent = `data: ${JSON.stringify({ type: 'tool_call', id: 'commit_1', name: 'commit_code', status: 'complete', output: { path: fileName, url: lastCommitUrl } })}\n\n`;
                    controller.enqueue(encoder.encode(toolCompleteEvent));
                    
                    // Send commit URL event
                    const commitEvent = `data: ${JSON.stringify({ type: 'commit', url: lastCommitUrl, path: fileName })}\n\n`;
                    controller.enqueue(encoder.encode(commitEvent));
                    
                    if (repoId) {
                      await supabaseClient.from('edit_logs').insert({
                        user_id: user.id,
                        repo_id: repoId,
                        file_path: fileName,
                        prompt: lastUserMessage,
                        changes_made: 'AI generated code changes',
                      });
                    }
                  } else {
                    const errorText = await commitResponse.text();
                    console.error('Failed to commit (fallback):', commitResponse.status, errorText);
                    
                    // Send tool error event
                    const toolErrorEvent = `data: ${JSON.stringify({ type: 'tool_call', id: 'commit_1', name: 'commit_code', status: 'error', output: { error: errorText } })}\n\n`;
                    controller.enqueue(encoder.encode(toolErrorEvent));
                  }
                } else {
                  console.log('No code blocks found matching fallback pattern');
                }
              } else {
                // Commit each proposed change
                for (const change of proposed) {
                  console.log(`Committing change to ${change.path}`);
                  
                  // Send tool call for each file
                  const toolFileEvent = `data: ${JSON.stringify({ type: 'tool_call', id: `commit_${change.path}`, name: 'commit_file', status: 'running', input: { path: change.path } })}\n\n`;
                  controller.enqueue(encoder.encode(toolFileEvent));
                  
                  const fileUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${change.path}`;
                  let sha = '';
                  try {
                    const fileResponse = await fetch(fileUrl, {
                      headers: {
                        'Authorization': `Bearer ${GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json',
                      },
                    });
                    if (fileResponse.ok) {
                      const fileData = await fileResponse.json();
                      sha = fileData.sha || '';
                    }
                  } catch (e) {
                    console.log(`Could not fetch existing file SHA for ${change.path}:`, e);
                  }

                  const commitResponse = await fetch(fileUrl, {
                    method: 'PUT',
                    headers: {
                      'Authorization': `Bearer ${GITHUB_TOKEN}`,
                      'Accept': 'application/vnd.github.v3+json',
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      message: `AI Edit: ${lastUserMessage.slice(0, 50)} (${change.path})`,
                      content: btoa(change.content),
                      ...(sha && { sha }),
                    }),
                  });

                  if (commitResponse.ok) {
                    const commitData = await commitResponse.json();
                    lastCommitUrl = commitData.commit?.html_url || '';
                    console.log('Successfully committed:', change.path, lastCommitUrl);
                    
                    // Send tool complete event
                    const toolFileCompleteEvent = `data: ${JSON.stringify({ type: 'tool_call', id: `commit_${change.path}`, name: 'commit_file', status: 'complete', output: { path: change.path, url: lastCommitUrl } })}\n\n`;
                    controller.enqueue(encoder.encode(toolFileCompleteEvent));
                    
                    // Send commit URL event
                    const commitEvent = `data: ${JSON.stringify({ type: 'commit', url: lastCommitUrl, path: change.path })}\n\n`;
                    controller.enqueue(encoder.encode(commitEvent));
                    
                    if (repoId) {
                      await supabaseClient.from('edit_logs').insert({
                        user_id: user.id,
                        repo_id: repoId,
                        file_path: change.path,
                        prompt: lastUserMessage,
                        changes_made: 'AI generated code changes',
                      });
                    }
                  } else {
                    const errorText = await commitResponse.text();
                    console.error(`Failed to commit ${change.path}:`, commitResponse.status, errorText);
                    
                    // Send tool error event
                    const toolFileErrorEvent = `data: ${JSON.stringify({ type: 'tool_call', id: `commit_${change.path}`, name: 'commit_file', status: 'error', output: { error: errorText } })}\n\n`;
                    controller.enqueue(encoder.encode(toolFileErrorEvent));
                  }
                }
              }
            } catch (commitError) {
              console.error('Error committing code:', commitError);
              const errorEvent = `data: ${JSON.stringify({ error: 'Failed to commit code', details: commitError instanceof Error ? commitError.message : String(commitError) })}\n\n`;
              controller.enqueue(encoder.encode(errorEvent));
            }
          } else {
            if (!repoOwner || !repoName) {
              console.log('Missing repo info - skipping commit');
            } else if (!GITHUB_TOKEN) {
              console.log('Missing GitHub token - skipping commit');
            } else {
              console.log('No code blocks detected in response');
            }
          }

          // Send done signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Error in ai-chat:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
