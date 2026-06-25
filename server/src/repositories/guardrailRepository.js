/**
 * @fileoverview Guardrail Rules Repository
 * Loads and updates guardrail rules from Supabase at runtime.
 * This enables the dashboard to update guards WITHOUT restarting the server.
 */
import supabase from '../config/supabase.js';

const DEFAULT_RULES = [
  { id: '1', name: 'Prompt Injection',   type: 'prompt', pattern: 'ignore.*instructions|disregard.*instructions', enabled: true, severity: 'high' },
  { id: '2', name: 'Jailbreak Attempt',  type: 'prompt', pattern: 'you are now|bypass.*rules|bypass.*restrictions', enabled: true, severity: 'high' },
  { id: '3', name: 'Role Escalation',    type: 'prompt', pattern: 'act as.*admin|act as.*superuser', enabled: true, severity: 'high' },
  { id: '4', name: 'Reveal System Prompt', type: 'prompt', pattern: 'reveal.*system prompt|show.*system prompt|extract.*prompt', enabled: true, severity: 'high' },
  { id: '5', name: 'Calculator Tool',    type: 'tool',   pattern: 'calculator',  enabled: true, severity: 'low' },
  { id: '6', name: 'User Profile Tool',  type: 'tool',   pattern: 'userProfile', enabled: true, severity: 'low' },
  { id: '7', name: 'Knowledge Tool',     type: 'tool',   pattern: 'knowledge',   enabled: true, severity: 'low' },
];

let cachedRules = JSON.parse(JSON.stringify(DEFAULT_RULES));

export class GuardrailRepository {
  /**
   * Fetch all rules from DB. Falls back to in-memory cache if Supabase unavailable.
   */
  async getRules() {
    if (!supabase) return cachedRules;
    try {
      const { data, error } = await supabase
        .from('guardrail_rules')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      
      if (data && data.length > 0) {
        cachedRules = data;
        return data;
      }
      return cachedRules;
    } catch (err) {
      console.warn(`[DB] Could not fetch guardrails: ${err.message}. Using memory fallback.`);
      return cachedRules;
    }
  }

  async updateRule(id, updates) {
    const idx = cachedRules.findIndex(r => r.id === id);
    if (idx !== -1) {
      cachedRules[idx] = { ...cachedRules[idx], ...updates };
    }

    if (!supabase) return cachedRules[idx] || updates;

    try {
      const { data, error } = await supabase
        .from('guardrail_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      if (data && idx !== -1) cachedRules[idx] = data;
      return data;
    } catch (err) {
      console.warn(`[DB] Could not persist guardrail update: ${err.message}. Using memory fallback.`);
      return cachedRules[idx] || updates;
    }
  }

  /**
   * Get only enabled prompt-type rules as regex patterns.
   */
  async getPromptPatterns() {
    const rules = await this.getRules();
    return rules
      .filter(r => r.type === 'prompt' && r.enabled)
      .map(r => ({ name: r.name, pattern: new RegExp(r.pattern, 'i'), severity: r.severity }));
  }

  /**
   * Get set of allowed tool names (enabled tool-type rules).
   */
  async getAllowedTools() {
    const rules = await this.getRules();
    return rules
      .filter(r => r.type === 'tool' && r.enabled)
      .map(r => r.pattern);
  }
}

export const guardrailRepository = new GuardrailRepository();
