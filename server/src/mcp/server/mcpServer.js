import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
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
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
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

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      try {
        const result = await this.registry.executeTool(name, args);
        return {
          content: [{ type: "text", text: JSON.stringify(result) }]
        };
      } catch (error) {
        logger.error(`Tool call failed: ${name}`, { error: error.message });
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
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
