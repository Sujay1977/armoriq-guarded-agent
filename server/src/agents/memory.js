/**
 * @fileoverview In-memory Conversation Store
 */
const conversations = new Map();

export class AgentMemory {
  store(conversationId, message, role = 'user') {
    if (!conversations.has(conversationId)) {
      conversations.set(conversationId, []);
    }
    const history = conversations.get(conversationId);
    history.push({ role, message, timestamp: new Date() });
  }

  retrieve(conversationId) {
    return conversations.get(conversationId) || [];
  }
  
  clear(conversationId) {
    conversations.delete(conversationId);
  }
}
