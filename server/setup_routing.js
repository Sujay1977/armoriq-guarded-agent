import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'src');

fs.writeFileSync(path.join(srcDir, 'agents/router.js'), `
export class AgentRouter {
  routeRequest(context) {
    const text = context.message.toLowerCase();
    
    // Simple keyword matching for tools
    if (text.includes('calculate') || text.match(/^[0-9+\\-*/\\s().]+$/)) {
      return { route: 'tool', tool: 'calculator' };
    }
    if (text.includes('profile')) {
      return { route: 'tool', tool: 'userProfile' };
    }
    if (text.includes('policy') || text.includes('knowledge')) {
      return { route: 'tool', tool: 'knowledge' };
    }

    return { route: 'direct', tool: null };
  }

  // Utility to extract args based on tool
  extractArgs(tool, context) {
    const text = context.message;
    if (tool === 'calculator') {
      const exp = text.replace(/calculate\\s*/i, '').trim();
      return { expression: exp };
    }
    if (tool === 'userProfile') {
      return { userId: context.user.id };
    }
    if (tool === 'knowledge') {
      return { query: text };
    }
    return {};
  }
}
`);

fs.writeFileSync(path.join(srcDir, 'agents/orchestrator.js'), `
import { AgentMemory } from './memory.js';
import { AgentRouter } from './router.js';
import { AiProviderService } from '../services/aiProvider.service.js';
import { createLocalTransports } from '../mcp/transports/localTransport.js';
import { McpServer } from '../mcp/server/mcpServer.js';
import { McpClient } from '../mcp/client/mcpClient.js';
import { validateToolExecution } from '../guards/toolGuard.js';
import { logger } from '../utils/logger.util.js';
import { v4 as uuidv4 } from 'uuid';

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
  }

  async process(context) {
    const { user, message, history, requestId, timestamp, conversationId } = context;
    
    // Store user message
    this.memory.store(conversationId, message, 'user');
    
    // Route request
    const { route, tool } = this.router.routeRequest(context);
    
    if (route === 'tool' && tool) {
      // 1. Extract arguments
      const args = this.router.extractArgs(tool, context);

      // 2. Run Tool Guard
      const guardResult = validateToolExecution(tool, args, {});

      logger.info('Tool Guard Decision', { 
        toolName: tool, 
        userId: user.id, 
        decision: guardResult.allowed ? 'ALLOW' : 'BLOCK' 
      });

      if (!guardResult.allowed) {
        return {
          response: guardResult.reason,
          route: 'blocked',
          tool: tool,
          conversationId,
          timestamp: new Date().toISOString()
        };
      }

      // 3. Execute via MCP Client
      const startTime = Date.now();
      try {
        const result = await this.mcpClient.callTool(tool, args);
        const executionTimeMs = Date.now() - startTime;
        
        logger.info(\`Tool Execution Completed\`, { toolName: tool, userId: user.id, conversationId, executionTimeMs });

        let responseText = '';
        if (result.isError) {
           responseText = result.content[0].text;
        } else {
           const data = JSON.parse(result.content[0].text);
           responseText = JSON.stringify(data);
        }

        const formattedResponse = \`[Tool Result: \${tool}]\\n\${responseText}\`;

        this.memory.store(conversationId, formattedResponse, 'agent');
        
        return {
          response: formattedResponse,
          route: 'tool',
          tool: tool,
          provider: 'mcp',
          conversationId,
          timestamp: new Date().toISOString()
        };
      } catch (err) {
        return {
          response: \`Tool execution error: \${err.message}\`,
          route: 'error',
          tool: tool,
          conversationId,
          timestamp: new Date().toISOString()
        };
      }
    }

    // Call AI Provider
    const aiResult = await this.aiProvider.generateResponse(context);
    
    // Store agent response
    this.memory.store(conversationId, aiResult.response, 'agent');

    return {
      response: aiResult.response,
      provider: aiResult.provider,
      model: aiResult.model,
      route: aiResult.route || route,
      conversationId,
      timestamp: new Date().toISOString()
    };
  }
}
`);

console.log("Routing files created successfully.");
