/**
 * @fileoverview Prompt Guard - Detects prompt injection, jailbreaks, etc.
 * Rules are loaded dynamically from guardrailRepository so dashboard
 * changes take effect immediately without server restart.
 */
import { guardrailRepository } from '../repositories/guardrailRepository.js';

export const validatePrompt = async (prompt) => {
  const patterns = await guardrailRepository.getPromptPatterns();

  for (const { name, pattern, severity } of patterns) {
    if (pattern.test(prompt)) {
      let category = 'prompt_injection';
      if (/ignore.*instructions/i.test(prompt)) category = 'jailbreak';
      else if (/act as.*admin/i.test(prompt)) category = 'role_escalation';

      return {
        allowed: false,
        reason: `Blocked by Prompt Guard: ${name} detected.`,
        severity,
        category,
        riskScore: 90
      };
    }
  }

  return {
    allowed: true,
    reason: 'Prompt is safe.',
    severity: 'low',
    category: 'safe',
    riskScore: 0
  };
};

