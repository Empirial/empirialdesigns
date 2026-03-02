-- Create user_repos table for storing GitHub repository mappings
CREATE TABLE public.user_repos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  repo_url TEXT NOT NULL,
  repo_owner TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  github_token TEXT, -- Encrypted token for repo access
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, repo_owner, repo_name)
);

-- Enable RLS
ALTER TABLE public.user_repos ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own repos
CREATE POLICY "Users can view their own repos"
  ON public.user_repos
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own repos"
  ON public.user_repos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own repos"
  ON public.user_repos
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own repos"
  ON public.user_repos
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create edit_logs table for tracking AI edits
CREATE TABLE public.edit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  repo_id UUID NOT NULL REFERENCES public.user_repos(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  prompt TEXT NOT NULL,
  changes_made TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.edit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own edit logs
CREATE POLICY "Users can view their own edit logs"
  ON public.edit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own edit logs"
  ON public.edit_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_repos_updated_at
  BEFORE UPDATE ON public.user_repos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();