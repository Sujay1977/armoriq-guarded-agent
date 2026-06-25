/**
 * @fileoverview Guard Service implementing the centralized execution flow.
 */
import { validatePrompt, validatePolicy, validateToolExecution, filterOutput, logAuditEvent } from '../guards/index.js';

// Simple in-memory metrics
const metrics = {
  totalRequests: 0,
  blockedRequests: 0,
  promptInjections: 0,
  jailbreakAttempts: 0,
  toolAbuseAttempts: 0
};

const updateMetrics = (category) => {
  metrics.blockedRequests++;
  if (category === 'prompt_injection') metrics.promptInjections++;
  if (category === 'jailbreak') metrics.jailbreakAttempts++;
  if (category === 'tool_abuse') metrics.toolAbuseAttempts++;
};

export class GuardService {
  /**
   * Run the pre-execution guard pipeline (Prompt -> Policy -> Tool)
   */
  async runGuards(prompt, userContext = {}, toolContext = null, correlationId = 'unknown') {
    metrics.totalRequests++;

    // 1. Prompt Guard (async - loads rules from DB)
    const promptResult = await validatePrompt(prompt);
    logAuditEvent(promptResult, correlationId, { phase: 'PromptGuard', prompt: prompt.substring(0, 200) });
    if (!promptResult.allowed) {
      updateMetrics(promptResult.category);
      return promptResult;
    }

    // 2. Policy Guard
    const policyResult = validatePolicy(userContext, prompt);
    logAuditEvent(policyResult, correlationId, { phase: 'PolicyGuard', prompt: prompt.substring(0, 200) });
    if (!policyResult.allowed) {
      updateMetrics(policyResult.category);
      return policyResult;
    }

    // 3. Tool Guard (if applicable, async - loads allowed tools from DB)
    if (toolContext) {
      const toolResult = await validateToolExecution(toolContext.toolName, toolContext.args, toolContext.mcpMetadata);
      logAuditEvent(toolResult, correlationId, { phase: 'ToolGuard', tool: toolContext.toolName });
      if (!toolResult.allowed) {
        updateMetrics(toolResult.category);
        return toolResult;
      }
    }

    return { allowed: true, reason: 'All pre-execution guards passed.', category: 'safe', severity: 'low', riskScore: 0 };
  }

  /**
   * Run the post-execution guard pipeline (Output Guard)
   */
  async runOutputGuards(response, correlationId = 'unknown') {
    const outputResult = filterOutput(response);
    logAuditEvent(outputResult, correlationId, { phase: 'OutputGuard' });
    
    if (!outputResult.allowed) {
      updateMetrics(outputResult.category);
      return outputResult;
    }

    return outputResult;
  }

  getMetrics() {
    return { ...metrics };
  }
}

