import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { repoName, description, isPrivate } = await req.json();
    const GITHUB_TOKEN = Deno.env.get('GITHUB_ACCESS_TOKEN');

    if (!GITHUB_TOKEN) {
      throw new Error('GitHub token not configured');
    }

    if (!repoName) {
      throw new Error('Repository name is required');
    }

    // Create repository on GitHub
    const createResponse = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: repoName,
        description: description || 'AI-generated website',
        private: isPrivate || false,
        auto_init: false, // We'll initialize with files ourselves
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('GitHub API error:', createResponse.status, errorText);
      throw new Error(`Failed to create repository: ${createResponse.status} ${errorText}`);
    }

    const repoData = await createResponse.json();
    
    // Extract owner and name
    const repoOwner = repoData.owner.login;
    const repoUrl = repoData.html_url;

    return new Response(JSON.stringify({
      success: true,
      repo: {
        id: repoData.id.toString(),
        name: repoData.name,
        owner: repoOwner,
        url: repoUrl,
        full_name: repoData.full_name,
        clone_url: repoData.clone_url,
        default_branch: repoData.default_branch,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in github-create-repo:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

