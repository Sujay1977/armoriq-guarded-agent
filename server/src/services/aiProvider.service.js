/**
 * @fileoverview AI Provider Abstraction Service
 */
import { GeminiService } from './gemini.service.js';

export class AiProviderService {
  constructor() {
    this.provider = new GeminiService();
  }

  async generateResponse(context) {
    return this.provider.generateResponse(context);
  }
}
