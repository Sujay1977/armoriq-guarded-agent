/**
 * @fileoverview Agent Router - Routes requests to tools or direct AI.
 * Tool routing is based on keywords but which tools EXIST is discovered
 * dynamically from the MCP server via listTools(), not hardcoded.
 */

export class AgentRouter {
  constructor(mcpClient = null) {
    // mcpClient is injected by the orchestrator after MCP initialisation
    this.mcpClient = mcpClient;
    this._availableTools = null; // lazily populated from MCP
  }

  setMcpClient(client) {
    this.mcpClient = client;
    this._availableTools = null; // reset cache when client changes
  }

  /**
   * Discover available tools from MCP server.
   * Results are cached for the lifetime of the process but can be
   * refreshed by calling refreshTools().
   */
  async getAvailableTools() {
    if (this._availableTools) return this._availableTools;
    if (!this.mcpClient) return [];
    try {
      const result = await this.mcpClient.listTools();
      this._availableTools = (result.tools || []).map(t => t.name);
      return this._availableTools;
    } catch {
      return [];
    }
  }

  async refreshTools() {
    this._availableTools = null;
    return this.getAvailableTools();
  }

  /**
   * Route a request to a tool or direct AI.
   * Returns { route, tool } where route is 'tool' | 'direct'
   * and tool is the MCP tool name or null.
   */
  async routeRequest(context) {
    const text = context.message.toLowerCase();
    const available = await this.getAvailableTools();

    // Only route to tools that are actually registered in MCP
    if (available.includes('calculator') && (text.includes('calculate') || text.match(/^[0-9+\-*/\s().]+$/))) {
      return { route: 'tool', tool: 'calculator' };
    }
    if (available.includes('userProfile') && text.includes('profile')) {
      return { route: 'tool', tool: 'userProfile' };
    }
    if (available.includes('knowledge') && (text.includes('policy') || text.includes('knowledge') || text.includes('refund') || text.includes('contact'))) {
      return { route: 'tool', tool: 'knowledge' };
    }

    return { route: 'direct', tool: null };
  }

  extractArgs(tool, context) {
    const text = context.message;
    if (tool === 'calculator') {
      const exp = text.replace(/calculate\s*/i, '').trim();
      return { expression: exp };
    }
    if (tool === 'userProfile') {
      // No user auth — use a placeholder userId for the MCP tool demonstration
      return { userId: '00000000-0000-0000-0000-000000000000' };
    }
    if (tool === 'knowledge') {
      return { query: text };
    }
    return {};
  }
}

