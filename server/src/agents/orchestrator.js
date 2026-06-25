import { AgentMemory } from './memory.js';
import { AgentRouter } from './router.js';
import { AiProviderService } from '../services/aiProvider.service.js';
import { createLocalTransports } from '../mcp/transports/localTransport.js';
import { McpServer } from '../mcp/server/mcpServer.js';
import { McpClient } from '../mcp/client/mcpClient.js';
import { validateToolExecution } from '../guards/toolGuard.js';
import { logger } from '../utils/logger.util.js';
import { v4 as uuidv4 } from 'uuid';
import { conversationRepository } from '../repositories/conversationRepository.js';
import { messageRepository } from '../repositories/messageRepository.js';

export class AgentOrchestrator {
  constructor() {
    this.memory = new AgentMemory();
    this.router = new AgentRouter();
    this.aiProvider = new AiProviderService();
    this.initMcp();
  }

  async initMcp() {
    const [clientTransport, serverTransport] = createLocalTransports();
    this.mcpServer = new McpServer(serverTransport);
    this.mcpClient = new McpClient(clientTransport);
    await this.mcpServer.start();
    await this.mcpClient.start();
    // Give the router access to the live MCP client for dynamic tool discovery
    this.router.setMcpClient(this.mcpClient);
  }

  async process(context) {
    const { user, message, history, requestId, timestamp } = context;
    let { conversationId } = context;

    // Ensure conversation exists or create one (best-effort DB)
    if (conversationId) {
      try {
        const existing = await conversationRepository.getConversationById(conversationId);
        if (!existing) conversationId = null; // treat as new if not found
      } catch { /* DB unavailable — will create fresh */ }
    }
    if (!conversationId) conversationId = uuidv4();

    let persisted = true;

    try {
      const existing = conversationId ? await conversationRepository.getConversationById(conversationId) : null;
      if (!existing) {
        let title = message;
        if (title.length > 40) title = title.substring(0, 37) + '...';
        const created = await conversationRepository.createConversation({ id: conversationId, user_id: null, title });
        if (!created) persisted = false;
      }
    } catch (dbErr) {
      persisted = false;
      console.error('[DB] Could not ensure conversation:', dbErr.message);
    }

    if (!persisted) {
        conversationId = null;
    }

    // Save user message (best-effort)
    try {
      const savedUserMsg = await messageRepository.saveMessage({
        conversation_id: conversationId,
        role: 'user',
        content: message
      });
      if (!savedUserMsg) persisted = false;
    } catch (dbErr) {
      persisted = false;
      console.error('[DB] Could not save user message:', dbErr.message);
    }

    // Store in short-term memory
    this.memory.store(conversationId, message, 'user');

    
    // Route request (async - dynamically discovers tools from MCP)
    const { route, tool } = await this.router.routeRequest(context);
    
    if (route === 'tool' && tool) {
      const args = this.router.extractArgs(tool, context);
      const guardResult = await validateToolExecution(tool, args, {});

      logger.info('Tool Guard Decision', { toolName: tool, decision: guardResult.allowed ? 'ALLOW' : 'BLOCK', route: 'tool', provider: 'mcp' });

      if (!guardResult.allowed) {
        const responseText = guardResult.reason;
        
        try {
          const savedBlockedMsg = await messageRepository.saveMessage({
            conversation_id: conversationId,
            role: 'model',
            content: responseText,
            tool_name: tool,
            tool_input: args,
            route: 'blocked',
            provider: 'mcp'
          });
          if (!savedBlockedMsg) persisted = false;
        } catch (dbErr) { 
            persisted = false;
            console.error('[DB] Could not save blocked-tool message:', dbErr.message); 
        }

        return { response: responseText, route: 'blocked', tool, conversationId: persisted ? conversationId : null, persisted, timestamp: new Date().toISOString() };
      }

      const startTime = Date.now();
      try {
        const result = await this.mcpClient.callTool(tool, args);
        const executionTimeMs = Date.now() - startTime;
        logger.info('Tool Execution Completed', { toolName: tool, conversationId, executionTimeMs });

        let toolOutputData = null;
        let responseText = '';
        if (result.isError) {
           responseText = result.content[0].text;
           toolOutputData = { error: responseText };
        } else {
           const data = JSON.parse(result.content[0].text);
           toolOutputData = data;
           responseText = JSON.stringify(data);
        }

        const formattedResponse = `[Tool Result: ${tool}]\n${responseText}`;

        try {
          const savedToolMsg = await messageRepository.saveMessage({
            conversation_id: conversationId,
            role: 'model',
            content: formattedResponse,
            tool_name: tool,
            tool_input: args,
            tool_output: toolOutputData,
            route: 'tool',
            provider: 'mcp'
          });
          if (!savedToolMsg) persisted = false;
        } catch (dbErr) { 
            persisted = false;
            console.error('[DB] Could not save tool response:', dbErr.message); 
        }

        this.memory.store(conversationId, formattedResponse, 'agent');
        
        return { response: formattedResponse, route: 'tool', tool, provider: 'mcp', conversationId: persisted ? conversationId : null, persisted, timestamp: new Date().toISOString() };
      } catch (err) {
        const errMessage = `Tool execution error: ${err.message}`;
        try {
            const savedErrorMsg = await messageRepository.saveMessage({
            conversation_id: conversationId,
            role: 'model',
            content: errMessage,
            tool_name: tool,
            tool_input: args,
            route: 'error',
            provider: 'mcp'
            });
            if (!savedErrorMsg) persisted = false;
        } catch (dbErr) {
            persisted = false;
            console.error('[DB] Could not save tool error response:', dbErr.message); 
        }

        return { response: errMessage, route: 'error', tool, conversationId: persisted ? conversationId : null, persisted, timestamp: new Date().toISOString() };
      }
    }

    // Direct AI Provider Route
    const aiResult = await this.aiProvider.generateResponse(context);
    
    try {
      const savedAiMsg = await messageRepository.saveMessage({
        conversation_id: conversationId,
        role: 'model',
        content: aiResult.response,
        route: aiResult.route || route,
        provider: aiResult.provider
      });
      if (!savedAiMsg) persisted = false;
    } catch (dbErr) { 
        persisted = false;
        console.error('[DB] Could not save AI response:', dbErr.message); 
    }

    this.memory.store(conversationId, aiResult.response, 'agent');

    return {
      response: aiResult.response,
      provider: aiResult.provider,
      model: aiResult.model,
      route: aiResult.route || route,
      conversationId: persisted ? conversationId : null,
      persisted,
      timestamp: new Date().toISOString()
    };
  }
}
