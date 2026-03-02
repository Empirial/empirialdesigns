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
    const { owner, repo, path, content, message, sha } = await req.json();
    const GITHUB_TOKEN = Deno.env.get('GITHUB_ACCESS_TOKEN');
    const authHeader = req.headers.get('Authorization');

    if (!GITHUB_TOKEN) {
      throw new Error('GitHub token not configured');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    // Get user from auth
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Encode content to base64
    const encodedContent = btoa(content);

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    console.log('Committing to GitHub:', url);

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Empirial-Designs-AI'
      },
      body: JSON.stringify({
        message,
        content: encodedContent,
        sha: sha || undefined
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub API error:', response.status, errorText);
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();

    // Log the edit
    const { data: repoData } = await supabaseClient
      .from('user_repos')
      .select('id')
      .eq('repo_owner', owner)
      .eq('repo_name', repo)
      .eq('user_id', user.id)
      .single();

    if (repoData) {
      await supabaseClient
        .from('edit_logs')
        .insert({
          user_id: user.id,
          repo_id: repoData.id,
          file_path: path,
          prompt: message,
          changes_made: 'File updated via AI'
        });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in github-commit:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});