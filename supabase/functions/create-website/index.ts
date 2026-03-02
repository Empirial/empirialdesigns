/// <reference path="../deno.d.ts" />

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Website type detection
function detectWebsiteType(message: string): {
  type: 'landing' | 'ecommerce' | 'blog' | 'portfolio' | 'saas' | 'restaurant' | 'custom';
  style: 'modern' | 'minimal' | 'corporate' | 'creative';
  features: string[];
} {
  const msg = message.toLowerCase();
  
  let type: 'landing' | 'ecommerce' | 'blog' | 'portfolio' | 'saas' | 'restaurant' | 'custom' = 'landing';
  if (msg.includes('shop') || msg.includes('store') || msg.includes('ecommerce') || msg.includes('product')) {
    type = 'ecommerce';
  } else if (msg.includes('blog') || msg.includes('post') || msg.includes('article')) {
    type = 'blog';
  } else if (msg.includes('portfolio') || msg.includes('project') || msg.includes('showcase')) {
    type = 'portfolio';
  } else if (msg.includes('saas') || msg.includes('software') || msg.includes('app')) {
    type = 'saas';
  } else if (msg.includes('restaurant') || msg.includes('menu') || msg.includes('food')) {
    type = 'restaurant';
  }

  let style: 'modern' | 'minimal' | 'corporate' | 'creative' = 'modern';
  if (msg.includes('minimal') || msg.includes('clean')) style = 'minimal';
  if (msg.includes('corporate') || msg.includes('business')) style = 'corporate';
  if (msg.includes('creative') || msg.includes('art')) style = 'creative';

  const features: string[] = [];
  if (msg.includes('pricing') || msg.includes('price')) features.push('pricing');
  if (msg.includes('contact') || msg.includes('form')) features.push('contact');
  if (msg.includes('testimonial') || msg.includes('review')) features.push('testimonials');
  if (msg.includes('about')) features.push('about');
  if (msg.includes('team')) features.push('team');

  return { type, style, features };
}

// Generate repository name from user message
function generateRepoName(message: string, userEmail: string): string {
  const msg = message.toLowerCase();
  
  // Extract potential name
  const nameMatch = msg.match(/(?:for|named|called)\s+([a-z0-9-]+)/i);
  if (nameMatch) {
    return nameMatch[1].toLowerCase().replace(/[^a-z0-9-]/g, '-');
  }
  
  // Generate from type
  const { type } = detectWebsiteType(message);
  const baseName = `${type}-website`;
  
  // Add timestamp for uniqueness
  const timestamp = Date.now().toString().slice(-6);
  return `${baseName}-${timestamp}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { prompt, repoName: providedRepoName, websiteType, companyName } = await req.json();
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    const GITHUB_TOKEN = Deno.env.get('GITHUB_ACCESS_TOKEN');

    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    if (!GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN is not configured');
    }

    // Detect website type and generate repo name
    const detected = detectWebsiteType(prompt);
    const repoName = providedRepoName || generateRepoName(prompt, user.email || 'user');

    // Step 1: Create GitHub repository
    console.log(`Creating repository: ${repoName}`);
    let createRepoResponse: Response;
    try {
      createRepoResponse = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: repoName,
          description: `AI-generated ${detected.type} website`,
          private: false,
          auto_init: false,
        }),
      });

      if (!createRepoResponse.ok) {
        const errorData = await createRepoResponse.json().catch(async () => ({ message: await createRepoResponse.text() }));
        
        if (createRepoResponse.status === 422 && errorData.errors?.some((e: any) => e.field === 'name')) {
          throw new Error(`Repository name "${repoName}" is invalid or already exists. Please choose a different name.`);
        } else if (createRepoResponse.status === 401) {
          throw new Error('GitHub authentication failed. Please check your GitHub token.');
        } else if (createRepoResponse.status === 403) {
          throw new Error('GitHub API rate limit exceeded or permission denied.');
        } else {
          throw new Error(`Failed to create repository: ${errorData.message || errorData.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create repository. Please try again.');
    }

    const repoData = await createRepoResponse.json();
    const repoOwner = repoData.owner.login;

    // Step 2: Generate website files using AI
    console.log('Generating website files...');
    
    const systemPrompt = `You are an expert web developer specializing in creating complete, production-ready React websites.

Your task: Generate a complete ${detected.type} website based on this request: "${prompt}"

Requirements:
1. Generate ALL necessary files for a working React + TypeScript + Vite + Tailwind CSS website
2. Use shadcn/ui components where appropriate
3. Include modern, responsive design
4. Style: ${detected.style}
5. Features needed: ${detected.features.join(', ') || 'basic functionality'}

You MUST provide the following files with complete code:

1. package.json - All dependencies including React, Vite, TypeScript, Tailwind, shadcn/ui components
2. vite.config.ts - Vite configuration
3. tsconfig.json, tsconfig.app.json, tsconfig.node.json - TypeScript configs
4. tailwind.config.ts - Tailwind configuration
5. postcss.config.js - PostCSS config
6. index.html - HTML entry point
7. src/main.tsx - React entry point
8. src/App.tsx - Main App component
9. src/index.css - Global styles with Tailwind
10. All necessary components in src/components/
11. .gitignore - Git ignore file
12. README.md - Project documentation

Format each file EXACTLY like this:
\`\`\`json path=package.json
[complete file content]
\`\`\`

\`\`\`ts path=vite.config.ts
[complete file content]
\`\`\`

CRITICAL:
- Provide COMPLETE, working code for every file
- All imports must be correct
- All files must be compatible with each other
- Use modern React patterns (hooks, functional components)
- Include responsive design with Tailwind
- Make it visually appealing and professional
- Company name: ${companyName || 'My Company'}`;

    const models = [
      'deepseek/deepseek-r1-0528',
      'deepseek/deepseek-r1',
      'google/gemini-pro',
      'mistralai/mistral-large'
    ];

    let aiResponse;
    let currentModelIndex = 0;

    while (currentModelIndex < models.length) {
      const currentModel = models[currentModelIndex];
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://empirialdesigns.co.za',
            'X-Title': 'Empirial Designs',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: currentModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          aiResponse = data.choices[0]?.message?.content || '';
          break;
        }
        currentModelIndex++;
      } catch (error) {
        currentModelIndex++;
        continue;
      }
    }

    if (!aiResponse) {
      throw new Error('Failed to generate website code. All AI models are currently unavailable. Please try again later.');
    }

    if (aiResponse.length < 500) {
      console.warn('AI response seems too short, but proceeding...');
    }

    // Step 3: Extract files from AI response
    const fileRegex = /```(\w+)?\s*(?:path|file|filename)=([^\n]+)\n([\s\S]*?)```/g;
    const files: Array<{ path: string; content: string }> = [];
    let match;

    while ((match = fileRegex.exec(aiResponse)) !== null) {
      const path = match[2].trim();
      const content = match[3].trim();
      if (path && content) {
        files.push({ path, content });
      }
    }

    // Fallback: try to extract without explicit paths
    if (files.length === 0) {
      const fallbackRegex = /```(\w+)?\n([\s\S]*?)```/g;
      let fallbackMatch;
      const knownFiles = ['package.json', 'vite.config.ts', 'src/App.tsx', 'src/main.tsx', 'index.html'];
      let fileIndex = 0;
      
      while ((fallbackMatch = fallbackRegex.exec(aiResponse)) !== null && fileIndex < knownFiles.length) {
        const content = fallbackMatch[2].trim();
        if (content.length > 50) { // Valid file content
          files.push({ path: knownFiles[fileIndex], content });
          fileIndex++;
        }
      }
    }

    if (files.length === 0) {
      console.error('AI response:', aiResponse.substring(0, 500));
      throw new Error('No valid files found in AI response. The AI may not have formatted the code blocks correctly. Please try again with a more specific prompt.');
    }

    // Validate minimum required files
    const requiredFiles = ['package.json', 'src/App.tsx', 'index.html'];
    const hasRequired = requiredFiles.some(req => files.some(f => f.path.includes(req.split('/').pop() || '')));
    if (!hasRequired && files.length < 3) {
      throw new Error(`Generated files seem incomplete. Only found ${files.length} files. Please try again.`);
    }

    console.log(`Extracted ${files.length} files to commit`);

    // Step 4: Commit files to repository using GitHub API
    // Get default branch
    const defaultBranch = repoData.default_branch || 'main';

    // Create blobs for each file
    const blobs = [];
    const blobErrors: string[] = [];
    
    for (const file of files) {
      try {
        // Validate file content
        if (!file.content || file.content.trim().length === 0) {
          console.warn(`Skipping empty file: ${file.path}`);
          continue;
        }

        const blobResponse = await fetch(
          `https://api.github.com/repos/${repoOwner}/${repoName}/git/blobs`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GITHUB_TOKEN}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: btoa(file.content),
              encoding: 'base64',
            }),
          }
        );

        if (!blobResponse.ok) {
          const errorText = await blobResponse.text();
          blobErrors.push(`${file.path}: ${errorText}`);
          console.error(`Failed to create blob for ${file.path}:`, errorText);
          continue;
        }

        const blob = await blobResponse.json();
        blobs.push({ path: file.path, sha: blob.sha, mode: '100644', type: 'blob' });
      } catch (error) {
        blobErrors.push(`${file.path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error(`Error creating blob for ${file.path}:`, error);
      }
    }

    if (blobs.length === 0) {
      const errorMsg = blobErrors.length > 0 
        ? `Failed to create any file blobs. Errors: ${blobErrors.slice(0, 3).join('; ')}`
        : 'Failed to create file blobs. No files could be uploaded.';
      throw new Error(errorMsg);
    }

    if (blobs.length < files.length) {
      console.warn(`Only created ${blobs.length} of ${files.length} blobs. Proceeding with available files.`);
    }

    // Create tree
    let treeResponse: Response;
    try {
      treeResponse = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/git/trees`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            base_tree: null,
            tree: blobs,
          }),
        }
      );

      if (!treeResponse.ok) {
        const errorData = await treeResponse.json().catch(async () => ({ message: await treeResponse.text() }));
        throw new Error(`Failed to create file tree: ${errorData.message || errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Failed to create file tree')) {
        throw error;
      }
      throw new Error(`Failed to create file tree: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const tree = await treeResponse.json();

    // Create commit
    const commitResponse = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/git/commits`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Initial commit: AI-generated website',
          tree: tree.sha,
          parents: [],
        }),
      }
    );

    if (!commitResponse.ok) {
      const errorText = await commitResponse.text();
      throw new Error(`Failed to create commit: ${errorText}`);
    }

    const commit = await commitResponse.json();

    // Update default branch to point to commit
    try {
      const refResponse = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/git/refs/heads/${defaultBranch}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sha: commit.sha,
            force: true,
          }),
        }
      );

      if (!refResponse.ok) {
        // Try creating the ref if it doesn't exist
        const createRefResponse = await fetch(
          `https://api.github.com/repos/${repoOwner}/${repoName}/git/refs`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GITHUB_TOKEN}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ref: `refs/heads/${defaultBranch}`,
              sha: commit.sha,
            }),
          }
        );

        if (!createRefResponse.ok) {
          console.error('Failed to update or create branch ref, but commit was created');
          // Don't throw - commit exists, just ref might not be updated
        }
      }
    } catch (error) {
      console.error('Error updating branch ref:', error);
      // Don't throw - commit was successful
    }

    // Step 5: Cache repository structure
    const structure = files.map(f => ({
      type: 'file',
      path: f.path,
      name: f.path.split('/').pop() || f.path,
    }));

    // Step 6: Store in database
    const { data: repoRecord, error: dbError } = await supabaseClient
      .from('user_repos')
      .insert({
        user_id: user.id,
        repo_url: repoData.html_url,
        repo_owner: repoOwner,
        repo_name: repoName,
        repo_structure: structure,
        template_type: detected.type,
        generation_prompt: prompt,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Continue anyway - repo was created successfully
    }

    return new Response(JSON.stringify({
      success: true,
      repo: {
        id: repoRecord?.id || null,
        name: repoName,
        owner: repoOwner,
        url: repoData.html_url,
        files_created: files.length,
        commit_url: commit.html_url,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in create-website:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

