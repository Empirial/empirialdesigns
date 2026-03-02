-- Add fields for website generation
ALTER TABLE public.user_repos 
ADD COLUMN IF NOT EXISTS template_type TEXT,
ADD COLUMN IF NOT EXISTS generation_prompt TEXT;

COMMENT ON COLUMN public.user_repos.template_type IS 'Type of website template used (landing, ecommerce, blog, etc.)';
COMMENT ON COLUMN public.user_repos.generation_prompt IS 'Original prompt used to generate the website';

