-- ArmorIQ Database Schema
-- Run this entire file in the Supabase SQL editor to set up the database.
-- GRANTS at the bottom are required for the backend to work.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- (Optional legacy tables - not used by the no-auth app)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  refresh_token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Conversations: user_id is nullable (no auth required)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY,
  user_id UUID DEFAULT NULL,
  title VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Messages: full audit trail per message
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  content TEXT,
  tool_name VARCHAR(100),
  tool_input JSONB,
  tool_output JSONB,
  provider VARCHAR(100),
  route VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Guardrail rules: persisted policies editable from the dashboard
CREATE TABLE IF NOT EXISTS guardrail_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('prompt', 'tool', 'policy', 'output')),
  pattern TEXT,
  enabled BOOLEAN DEFAULT true,
  description TEXT,
  severity VARCHAR(50) DEFAULT 'high',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed default guardrail rules
INSERT INTO guardrail_rules (name, type, pattern, enabled, description, severity) VALUES
  ('Prompt Injection', 'prompt', 'ignore.*instructions|disregard.*instructions', true, 'Blocks prompt injection attempts', 'high'),
  ('Jailbreak Attempt', 'prompt', 'you are now|bypass.*rules|bypass.*restrictions', true, 'Blocks jailbreak attempts', 'high'),
  ('Role Escalation', 'prompt', 'act as.*admin|act as.*superuser', true, 'Blocks privilege escalation', 'high'),
  ('Reveal System Prompt', 'prompt', 'reveal.*system prompt|show.*system prompt|extract.*prompt', true, 'Blocks system prompt extraction', 'high'),
  ('Calculator Tool', 'tool', 'calculator', true, 'Allows calculator MCP tool', 'low'),
  ('User Profile Tool', 'tool', 'userProfile', true, 'Allows userProfile MCP tool', 'low'),
  ('Knowledge Tool', 'tool', 'knowledge', true, 'Allows knowledge MCP tool', 'low')
ON CONFLICT DO NOTHING;

-- ============================================================
-- REQUIRED: Grant permissions to service_role
-- Without this, the backend will get "permission denied" errors
-- ============================================================
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO service_role;
