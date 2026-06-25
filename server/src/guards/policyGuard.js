/**
 * @fileoverview Policy Guard - Validates inputs against configurable policies.
 */
import { policies } from '../config/policies.js';

export const validatePolicy = (context, prompt) => {
  const lowerPrompt = prompt.toLowerCase();
  
  for (const cmd of policies.dangerousCommands) {
    if (lowerPrompt.includes(cmd)) {
      return {
        allowed: false,
        reason: `Blocked by Policy Guard: Dangerous command detected (${cmd}).`,
        severity: "high",
        category: "unauthorized_operation",
        riskScore: 85
      };
    }
  }

  for (const action of policies.restrictedActions) {
    if (lowerPrompt.includes(action.replace(/_/g, ' '))) {
      return {
        allowed: false,
        reason: `Blocked by Policy Guard: Restricted action detected (${action}).`,
        severity: "high",
        category: "sensitive_data_access",
        riskScore: 80
      };
    }
  }

  return {
    allowed: true,
    reason: "Policy check passed.",
    severity: "low",
    category: "safe",
    riskScore: 0
  };
};
