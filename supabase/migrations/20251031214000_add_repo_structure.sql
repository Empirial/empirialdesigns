-- Add repo_structure column to store cached repository structure
ALTER TABLE public.user_repos 
ADD COLUMN IF NOT EXISTS repo_structure JSONB;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_repos_repo_structure 
ON public.user_repos(repo_structure) 
WHERE repo_structure IS NOT NULL;

COMMENT ON COLUMN public.user_repos.repo_structure IS 'Cached repository file structure for AI context';

