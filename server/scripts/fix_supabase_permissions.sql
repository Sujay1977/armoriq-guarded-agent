-- server/scripts/fix_supabase_permissions.sql

DO $$
BEGIN
    -- Verify service_role exists, if not this is not a Supabase environment
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
        
        -- 1. Grant USAGE on schema public
        GRANT USAGE ON SCHEMA public TO service_role;
        
        -- 2. Grant ALL privileges on all existing tables in public schema
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
        
        -- 3. Grant ALL privileges on all sequences in public schema (for auto-increment ids etc)
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
        
        -- 4. Alter Default Privileges so future tables also get these grants
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO service_role;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO service_role;

        -- We DO NOT blindly change ownership to service_role, as granting ALL PRIVILEGES is sufficient.
    END IF;
END
$$;
