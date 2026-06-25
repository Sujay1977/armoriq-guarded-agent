/**
 * @fileoverview Agent Controller
 */
import { AgentService } from '../services/agent.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';
import { v4 as uuidv4 } from 'uuid';

const agentService = new AgentService();

export const chat = async (req, res, next) => {
  try {
    const { message, conversationId: reqConvId } = req.body;
    if (!message) {
      return res.status(400).json(errorResponse('Message is required', 400));
    }

    const conversationId = reqConvId || uuidv4();
    const requestId = req.correlationId;
    
    // Auth is removed, default to local admin
    const user = { id: 'local-admin', name: 'Local Admin', role: 'admin' };

    const result = await agentService.processMessage(user, message, conversationId, requestId);
    
    res.status(200).json(successResponse(result));
  } catch (err) {
    next(err);
  }
};

/**
 * Returns the list of tools dynamically registered in the MCP server.
 * This powers the frontend MCP discovery panel.
 */
export const listTools = async (req, res, next) => {
  try {
    const tools = await agentService.orchestrator.mcpClient.listTools();
    res.json(successResponse(tools.tools || []));
  } catch (err) {
    next(err);
  }
};

/**
 * Returns guard metrics for the dashboard.
 */
export const getMetrics = async (req, res, next) => {
  try {
    const metrics = agentService.guardService.getMetrics();
    res.json(successResponse(metrics));
  } catch (err) {
    next(err);
  }
};

