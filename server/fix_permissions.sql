-- Fix for 42501 Permission Denied error for service_role
-- Execute this in the Supabase Dashboard SQL Editor

GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.conversations TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.messages TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.guardrail_rules TO service_role;

-- Grant permissions on future tables just in case
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO service_role;
