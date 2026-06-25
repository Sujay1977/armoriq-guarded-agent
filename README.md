<<<<<<< HEAD
# Guarded AI Agent

A production-ready Guarded AI Agent architecture featuring MCP (Model Context Protocol) support.

## Project Structure
- \`/server\`: Node.js + Express backend
- \`/client\`: React + Vite + Tailwind frontend

## Prerequisites
- Node.js v22 LTS
- NPM or Yarn

## Setup Instructions

### Backend (\`/server\`)
1. Navigate to the server directory: \`cd server\`
2. Install dependencies: \`npm install\`
3. Database Setup:
   - Create a project in [Supabase](https://supabase.com).
   - Open the Supabase SQL Editor and run the queries found in \`server/schema.sql\` to create the \`users\` and \`sessions\` tables.
   - Obtain your Supabase URL and Anon Key.
4. Copy the example environment file: \`cp .env.example .env\`
5. Fill in the environment variables in \`.env\`, including \`SUPABASE_URL\`, \`SUPABASE_ANON_KEY\`, \`JWT_SECRET\`, \`GEMINI_API_KEY\`, and \`GEMINI_MODEL\` (defaults to \`gemini-2.5-flash\`).
6. Start the development server: \`npm run dev\`

### Frontend (\`/client\`)
1. Navigate to the client directory: \`cd client\`
2. Install dependencies: \`npm install\`
3. Start the development server: \`npm run dev\`

## Features
- **Guarded AI Engine**: Extensible guardrails for AI safety.
- **Gemini Integration**: Dynamic AI response generation using Google's generative models with secure prompt management.
- **MCP Integration**: Connect AI agents to local and remote tools via Model Context Protocol.
- **Production Ready Foundation**: Security middlewares, request tracing, centralized logging, and structured validation.

## Example Request
To interact with the agent, first obtain a JWT access token via \`/api/v1/auth/login\`, then send a request to the chat endpoint:

\`\`\`bash
curl -X POST http://localhost:3000/api/v1/agent/chat \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "Hello, agent!",
    "conversationId": "optional-uuid"
  }'
\`\`\`
=======
# armoriq-guarded-agent
A secure AI agent with guardrails, MCP tool integration, prompt protection, policy engine, and conversation persistence.
>>>>>>> 8a47bdb7e78ad995eb7ec3d66a7c978fa33c036c
