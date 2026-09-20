-- ==============================================================================
-- FIX FOR "Database error checking email" IN SUPABASE AUTH
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/xnhnqbgpezfcvjptufao/sql/new
-- ==============================================================================

-- 1. Add columns expected by Supabase Auth (GoTrue)
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS is_sso_user BOOLEAN DEFAULT FALSE;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. Grant permissions so Auth service can access schemas and triggers
grant usage on schema private to supabase_auth_admin, postgres, service_role, authenticated, anon;
grant all on all functions in schema private to supabase_auth_admin, postgres, service_role, authenticated, anon;
grant all on schema public to supabase_auth_admin, postgres, service_role;
