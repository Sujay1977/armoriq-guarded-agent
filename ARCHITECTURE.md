# Guarded AI Agent Architecture

## Overview
This system is designed as a production-ready Guarded AI Agent supporting secure tool execution via the Model Context Protocol (MCP).

## Core Components

### 1. Authentication Layer
- JWT-based authentication using short-lived access tokens and secure HTTP-only refresh cookies.
- Connects to Supabase for persistence.

### 2. Guard Layer
A robust interception pipeline for input and output.
- **Prompt Guard**: Protects against jailbreaks, prompt injections, and role escalation.
- **Policy Guard**: Enforces operational constraints and restricted actions.
- **Tool Guard**: Validates tool invocation intent, arguments, and authorization against a global allowed tools list before execution.
- **Output Guard**: Post-generation sanitation avoiding PII leaks or unsafe artifacts.

### 3. Agent Orchestrator & Router
The central brain of the agent execution pipeline.
- Parses incoming requests (simple deterministic routing in this phase).
- Passes the sanitized request to the AI Provider (Gemini) or the MCP Layer (Tool Execution).
- Accumulates conversational context using an in-memory mechanism to provide short-term continuity.

### 4. AI Provider (Gemini)
- Abstraction decoupling the Orchestrator from the underlying AI LLM.
- Generates conversational responses using `@google/generative-ai` with robust system prompts protecting the guardrails.
- Employs graceful degradation if the provider is unavailable.

### 5. MCP Architecture
The Model Context Protocol establishes standardized tool exposure and usage.
- **MCP Client**: Exposes tool execution methods to the Agent Orchestrator.
- **MCP Server**: Hosts the functional definitions and registers the tools.
- **Tool Registry**: A central manager inside the server defining schemas (via Zod) and `execute` methods.
- **Transport**: Utilizes an `InMemoryTransport` linking the Client and Server securely in the same process to eliminate network latency while preserving architectural standards.

### 6. Chat Persistence
A complete database schema layer in Supabase supporting real-time conversational history.
- **`conversations`**: Maintains ownership, timestamps, and automatically generates titles using the initial user prompt.
- **`messages`**: Contains exact conversational turn data. Captures standard content, along with exact tool interaction metadata (`tool_name`, `tool_input`, `tool_output`, `provider`, and `route`) to support deep auditing.
- **Data Repositories**: Abstracts database interactions (`conversationRepository` and `messageRepository`), providing an optional local array mock fallback if Supabase credentials are not found.

## Tool Execution Flow
1. **User Request**: The user issues a prompt indicating a tool action (e.g., "calculate 10 * 5").
2. **Auth & Guard Layers**: The prompt passes JWT Auth and the Prompt/Policy guards.
3. **Routing**: `router.js` detects the intent and issues a `tool` route object.
4. **Tool Guard**: The Orchestrator passes the parsed arguments to `toolGuard` for authorization.
5. **MCP Client Request**: If authorized, `mcpClient.callTool(tool, args)` is invoked.
6. **MCP Server Handling**: The `mcpServer` receives the transport message, looks up the Tool Registry, and validates arguments against the Zod schema.
7. **Execution**: The tool successfully executes and the payload is returned.
8. **Response**: The orchestrator formats the response as `[Tool Result: <tool>] <data>` and serves it back to the user.
