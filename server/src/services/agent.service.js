/**
 * @fileoverview Agent Service
 */
import { GuardService } from './guard.service.js';
import { AgentOrchestrator } from '../agents/orchestrator.js';
import { conversationRepository } from '../repositories/conversationRepository.js';
import { messageRepository } from '../repositories/messageRepository.js';
import { v4 as uuidv4 } from 'uuid';

export class AgentService {
  constructor() {
    this.guardService = new GuardService();
    this.orchestrator = new AgentOrchestrator();
  }

  buildContext(user, message, conversationId, requestId) {
    const history = this.orchestrator.memory.retrieve(conversationId);
    return {
      user,
      message,
      history,
      requestId,
      timestamp: new Date().toISOString(),
      conversationId
    };
  }

  async processMessage(user, message, conversationId, requestId) {
    // 1. Guard Layer (Pre-execution)
    const guardResult = await this.guardService.runGuards(message, user, null, requestId);
    
    if (!guardResult.allowed) {
      // Persist conversation + messages (best-effort — don't crash if DB fails)
      let persisted = true;
      try {
        let conversation = await conversationRepository.getConversationById(conversationId);
        if (!conversation) {
          let title = message;
          if (title.length > 40) title = title.substring(0, 37) + '...';
          const created = await conversationRepository.createConversation({ id: conversationId, user_id: null, title });
          if (!created) persisted = false;
        }
        const savedUserMsg = await messageRepository.saveMessage({ conversation_id: conversationId, role: 'user', content: message });
        if (!savedUserMsg) persisted = false;
        const savedBlockedMsg = await messageRepository.saveMessage({
          conversation_id: conversationId,
          role: 'model',
          content: guardResult.reason,
          route: 'blocked',
          provider: 'system',
          tool_output: {
            reason: guardResult.reason,
            severity: guardResult.severity,
            category: guardResult.category,
            riskScore: guardResult.riskScore
          }
        });
        if (!savedBlockedMsg) persisted = false;
      } catch (dbErr) {
        persisted = false;
        console.error('[DB] Failed to persist guard-blocked message:', dbErr.message);
      }

      return {
        response: guardResult.reason,
        route: 'blocked',
        reason: guardResult.reason,
        severity: guardResult.severity,
        category: guardResult.category,
        riskScore: guardResult.riskScore,
        conversationId: persisted ? conversationId : null,
        persisted,
        timestamp: new Date().toISOString()
      };
    }


    // 2. Build Context
    const context = this.buildContext(user, message, conversationId, requestId);

    // 3. Orchestrator Processing
    const result = await this.orchestrator.process(context);

    // 4. Output Guard (Post-execution)
    const outputGuardResult = await this.guardService.runOutputGuards(result.response, requestId);
    if (!outputGuardResult.allowed) {
      return {
        response: "The agent's response was blocked due to sensitive content.",
        route: 'blocked',
        reason: outputGuardResult.reason,
        severity: outputGuardResult.severity,
        category: outputGuardResult.category,
        riskScore: outputGuardResult.riskScore,
        conversationId: result.conversationId,
        persisted: result.persisted,
        timestamp: new Date().toISOString()
      };
    }

    return result;
  }
}
