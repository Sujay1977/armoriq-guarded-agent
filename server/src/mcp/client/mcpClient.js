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
    return this.client.listTools();
  }

  async callTool(name, args) {
    return this.client.callTool({
      name,
      arguments: args
    });
  }
}
