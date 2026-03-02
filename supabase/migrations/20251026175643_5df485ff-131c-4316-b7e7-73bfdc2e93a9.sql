-- Add deploy_url column to user_repos table
ALTER TABLE user_repos ADD COLUMN IF NOT EXISTS deploy_url TEXT;