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

    const { action, repoUrl, repoOwner, repoName, repoId } = await req.json();

    // Helper function to fetch and cache repository structure
    async function fetchAndCacheRepoStructure(owner: string, name: string): Promise<any[]> {
      const GITHUB_TOKEN = Deno.env.get('GITHUB_ACCESS_TOKEN');
      if (!GITHUB_TOKEN) {
        console.log('No GitHub token, skipping structure fetch');
        return [];
      }

      async function fetchRepoStructure(path: string = '', maxDepth: number = 3, currentDepth: number = 0): Promise<any[]> {
        if (currentDepth >= maxDepth) return [];
        
        try {
          const url = `https://api.github.com/repos/${owner}/${name}/contents/${path}`;
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
              const subItems = await fetchRepoStructure(item.path, maxDepth, currentDepth + 1);
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

      try {
        console.log(`Fetching repository structure for ${owner}/${name}...`);
        const structure = await fetchRepoStructure('', 3, 0);
        console.log(`Fetched ${structure.length} items`);
        return structure;
      } catch (e) {
        console.error('Error fetching repo structure:', e);
        return [];
      }
    }

    if (action === 'add') {
      // Add new repo and cache structure
      const repoData: any = {
        user_id: user.id,
        repo_url: repoUrl,
        repo_owner: repoOwner,
        repo_name: repoName
      };

      // Fetch repository structure
      const structure = await fetchAndCacheRepoStructure(repoOwner, repoName);
      if (structure.length > 0) {
        repoData.repo_structure = structure;
        console.log(`Cached ${structure.length} files for ${repoOwner}/${repoName}`);
      }

      const { data, error } = await supabaseClient
        .from('user_repos')
        .insert(repoData)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else if (action === 'list') {
      // List user's repos
      const { data, error } = await supabaseClient
        .from('user_repos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else if (action === 'refresh_structure') {
      // Refresh repository structure cache
      if (!repoId) {
        throw new Error('repoId is required for refresh_structure');
      }

      const { data: repo } = await supabaseClient
        .from('user_repos')
        .select('repo_owner, repo_name')
        .eq('id', repoId)
        .eq('user_id', user.id)
        .single();

      if (!repo) {
        throw new Error('Repository not found');
      }

      const structure = await fetchAndCacheRepoStructure(repo.repo_owner, repo.repo_name);
      
      const { error } = await supabaseClient
        .from('user_repos')
        .update({ repo_structure: structure })
        .eq('id', repoId)
        .eq('user_id', user.id);

      if (error) throw error;

      return new Response(JSON.stringify({ 
        success: true, 
        structure_count: structure.length 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else if (action === 'delete') {
      // Delete repo
      const { repoId } = await req.json();
      const { error } = await supabaseClient
        .from('user_repos')
        .delete()
        .eq('id', repoId)
        .eq('user_id', user.id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');
  } catch (error) {
    console.error('Error in manage-repo:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});