/**
 * @fileoverview Gemini Service Integration
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/index.js';
import { logger } from '../utils/logger.util.js';
import { baseSystemPrompt } from '../prompts/systemPrompt.js';

export class GeminiService {
  constructor() {
    this.modelName = config.gemini.model || 'gemini-2.5-flash';
    this.providerName = 'gemini';
    if (config.gemini.apiKey) {
      this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
      this.model = this.genAI.getGenerativeModel({ 
        model: this.modelName,
        systemInstruction: baseSystemPrompt 
      });
    }
  }

  async generateResponse(context) {
    const { user, message, history, requestId, conversationId } = context;
    const startTime = Date.now();

    if (!this.model) {
      logger.error('Gemini API key is missing.');
      return {
        response: 'The AI service is currently unavailable.',
        provider: this.providerName,
        model: this.modelName,
        route: 'fallback'
      };
    }

    try {
      // Limit history to last 15 messages for context
      const recentHistory = history.slice(-15).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.message }]
      }));

      const chat = this.model.startChat({
        history: recentHistory,
      });

      const result = await chat.sendMessage(message);
      const responseText = result.response.text();

      const responseTimeMs = Date.now() - startTime;
      
      logger.info('AI Request Successful', {
        conversationId,
        provider: this.providerName,
        model: this.modelName,
        timestamp: new Date().toISOString(),
        responseTimeMs,
        correlationId: requestId
      });

      return {
        response: responseText,
        provider: this.providerName,
        model: this.modelName,
        route: 'direct'
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      logger.error('Gemini API Error', {
        error: error.message,
        conversationId,
        provider: this.providerName,
        model: this.modelName,
        responseTimeMs,
        correlationId: requestId
      });

      return {
        response: 'The AI service is currently unavailable.',
        provider: this.providerName,
        model: this.modelName,
        route: 'fallback'
      };
    }
  }
}
