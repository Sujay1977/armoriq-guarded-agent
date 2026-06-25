/**
 * @fileoverview Tool Guard - Validates tool executions.
 * Allowed tools are loaded from guardrailRepository at runtime so
 * dashboard changes (e.g. disabling calculator) take effect immediately.
 */
import { guardrailRepository } from '../repositories/guardrailRepository.js';

export const validateToolExecution = async (toolName, args, mcpMetadata) => {
  if (!toolName) {
    return {
      allowed: false,
      reason: 'Blocked by Tool Guard: Missing tool name.',
      severity: 'medium',
      category: 'tool_abuse',
      riskScore: 50
    };
  }

  const allowedTools = await guardrailRepository.getAllowedTools();

  if (!allowedTools.includes(toolName)) {
    return {
      allowed: false,
      reason: `Blocked by Tool Guard: Tool '${toolName}' is not enabled.`,
      severity: 'high',
      category: 'tool_abuse',
      riskScore: 75
    };
  }

  if (args && JSON.stringify(args).length > 5000) {
    return {
      allowed: false,
      reason: 'Blocked by Tool Guard: Arguments exceed maximum size.',
      severity: 'medium',
      category: 'tool_abuse',
      riskScore: 60
    };
  }

  return {
    allowed: true,
    reason: 'Tool execution authorized.',
    severity: 'low',
    category: 'safe',
    riskScore: 0
  };
};

