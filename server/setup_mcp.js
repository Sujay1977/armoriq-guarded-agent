import fs from 'fs';
import path from 'path';

const mcpDir = path.join(process.cwd(), 'src/mcp');
const dirs = ['client', 'server', 'registry', 'transports', 'tools'];

dirs.forEach(d => fs.mkdirSync(path.join(mcpDir, d), { recursive: true }));

// 1. Tool Registry
fs.writeFileSync(path.join(mcpDir, 'registry/toolRegistry.js'), `
import { logger } from '../../utils/logger.util.js';

export class ToolRegistry {
  constructor() {
    this.tools = new Map();
  }

  registerTool(tool) {
    if (!tool.name || !tool.execute) {
      throw new Error('Invalid tool definition');
    }
    this.tools.set(tool.name, tool);
    logger.info(\`Tool registered: \${tool.name}\`);
  }

  getTool(name) {
    return this.tools.get(name);
  }

  listTools() {
    return Array.from(this.tools.values()).map(t => ({
      name: t.name,
      description: t.description,
      schema: t.schema
    }));
  }

  async executeTool(name, input) {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(\`Tool not found: \${name}\`);
    }
    
    // Validate with Zod
    if (tool.schema) {
      const parseResult = tool.schema.safeParse(input);
      if (!parseResult.success) {
        throw new Error(\`Invalid arguments for tool \${name}: \${parseResult.error.message}\`);
      }
    }

    const startTime = Date.now();
    try {
      const result = await tool.execute(input);
      logger.info(\`Tool executed: \${name}\`, { executionTimeMs: Date.now() - startTime });
      return result;
    } catch (error) {
      logger.error(\`Tool execution failed: \${name}\`, { error: error.message });
      throw error;
    }
  }
}
`);

// 2. Transport
fs.writeFileSync(path.join(mcpDir, 'transports/localTransport.js'), `
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

export function createLocalTransports() {
  return InMemoryTransport.createLinkedPair();
}
`);

// 3. Server
fs.writeFileSync(path.join(mcpDir, 'server/mcpServer.js'), `
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ToolRegistry } from '../registry/toolRegistry.js';
import { calculatorTool } from '../tools/calculator.js';
import { userProfileTool } from '../tools/userProfile.js';
import { knowledgeTool } from '../tools/knowledge.js';
import { logger } from '../../utils/logger.util.js';

export class McpServer {
  constructor(transport) {
    this.transport = transport;
    this.registry = new ToolRegistry();
    
    // Register tools
    this.registry.registerTool(calculatorTool);
    this.registry.registerTool(userProfileTool);
    this.registry.registerTool(knowledgeTool);

    this.server = new Server({
      name: "Guarded-Agent-Server",
      version: "1.0.0"
    }, {
      capabilities: {
        tools: {}
      }
    });

    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: this.registry.listTools().map(t => ({
          name: t.name,
          description: t.description,
          inputSchema: t.schema ? {
            type: "object",
            properties: t.schema.shape ? Object.keys(t.schema.shape).reduce((acc, key) => {
              acc[key] = { type: "string" }; 
              return acc;
            }, {}) : {}
          } : { type: "object" }
        }))
      };
    });

    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;
      try {
        const result = await this.registry.executeTool(name, args);
        return {
          content: [{ type: "text", text: JSON.stringify(result) }]
        };
      } catch (error) {
        logger.error(\`Tool call failed: \${name}\`, { error: error.message });
        return {
          content: [{ type: "text", text: \`Error: \${error.message}\` }],
          isError: true
        };
      }
    });
  }

  async start() {
    await this.server.connect(this.transport);
    logger.info('MCP Server started.');
  }
}
`);

// 4. Client
fs.writeFileSync(path.join(mcpDir, 'client/mcpClient.js'), `
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { logger } from '../../utils/logger.util.js';

export class McpClient {
  constructor(transport) {
    this.transport = transport;
    this.client = new Client({
      name: "Guarded-Agent-Client",
      version: "1.0.0"
    }, {
      capabilities: {}
    });
  }

  async start() {
    await this.client.connect(this.transport);
    logger.info('MCP Client started.');
  }

  async listTools() {
    return this.client.request({ method: 'tools/list' }, Object);
  }

  async callTool(name, args) {
    return this.client.request({
      method: 'tools/call',
      params: { name, arguments: args }
    }, Object);
  }
}
`);

// 5. Tools
fs.writeFileSync(path.join(mcpDir, 'tools/calculator.js'), `
import { z } from 'zod';

export const calculatorTool = {
  name: 'calculator',
  description: 'Evaluate simple mathematical expressions.',
  schema: z.object({
    expression: z.string().min(1)
  }),
  execute: async ({ expression }) => {
    try {
      if (!/^[0-9+\\-*/\\s().]+$/.test(expression)) {
        throw new Error('Invalid characters in expression');
      }
      // eslint-disable-next-line no-new-func
      const result = new Function(\`return \${expression}\`)();
      return { result };
    } catch (e) {
      throw new Error(\`Calculation error: \${e.message}\`);
    }
  }
};
`);

fs.writeFileSync(path.join(mcpDir, 'tools/userProfile.js'), `
import { z } from 'zod';
import { userRepository } from '../../repositories/userRepository.js';

export const userProfileTool = {
  name: 'userProfile',
  description: 'Retrieve user profile by userId',
  schema: z.object({
    userId: z.string().uuid()
  }),
  execute: async ({ userId }) => {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('User not found');
    return {
      id: user.id,
      email: user.email,
      role: user.role
    };
  }
};
`);

fs.writeFileSync(path.join(mcpDir, 'tools/knowledge.js'), `
import { z } from 'zod';

const knowledgeBase = {
  "company policy": "Our company policy mandates a security-first approach, regular audits, and zero-trust architecture.",
  "refund policy": "Refunds are processed within 7-10 business days for eligible transactions.",
  "contact": "You can reach support at support@armoriq.com"
};

export const knowledgeTool = {
  name: 'knowledge',
  description: 'Retrieve answers from local knowledge base',
  schema: z.object({
    query: z.string().min(1)
  }),
  execute: async ({ query }) => {
    const q = query.toLowerCase();
    for (const [key, value] of Object.entries(knowledgeBase)) {
      if (q.includes(key)) {
        return { answer: value };
      }
    }
    return { answer: "I could not find an answer to your query in the knowledge base." };
  }
};
`);

console.log("MCP files created successfully.");
