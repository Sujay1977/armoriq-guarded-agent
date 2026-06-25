
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
    logger.info(`Tool registered: ${tool.name}`);
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
      throw new Error(`Tool not found: ${name}`);
    }
    
    // Validate with Zod
    if (tool.schema) {
      const parseResult = tool.schema.safeParse(input);
      if (!parseResult.success) {
        throw new Error(`Invalid arguments for tool ${name}: ${parseResult.error.message}`);
      }
    }

    const startTime = Date.now();
    try {
      const result = await tool.execute(input);
      logger.info(`Tool executed: ${name}`, { executionTimeMs: Date.now() - startTime });
      return result;
    } catch (error) {
      logger.error(`Tool execution failed: ${name}`, { error: error.message });
      throw error;
    }
  }
}
