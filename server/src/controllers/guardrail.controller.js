/**
 * @fileoverview Guardrails Controller
 * Handles GET/PUT operations for guardrail rules from the dashboard.
 * Changes take effect immediately on the running agent (no restart needed).
 */
import { guardrailRepository } from '../repositories/guardrailRepository.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

export const getGuardrailRules = async (req, res, next) => {
  try {
    const rules = await guardrailRepository.getRules();
    res.json(successResponse(rules));
  } catch (error) {
    next(error);
  }
};

export const updateGuardrailRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { enabled, name, description } = req.body;

    // Only allow toggling enabled state and metadata (not pattern changes for safety)
    const updates = {};
    if (typeof enabled === 'boolean') updates.enabled = enabled;
    if (name) updates.name = name;
    if (description) updates.description = description;

    const updated = await guardrailRepository.updateRule(id, updates);
    res.json(successResponse(updated));
  } catch (error) {
    next(error);
  }
};
