
import api from './api.js';

export const chatService = {
  getConversations: async (page = 1, limit = 20) => {
    const { data } = await api.get('/conversations', { params: { page, limit } });
    return data.data;
  },
  getConversationDetails: async (conversationId) => {
    const { data } = await api.get(`/conversations/${conversationId}`);
    return data.data;
  },
  sendMessage: async (message, conversationId) => {
    const payload = { message };
    if (conversationId) payload.conversationId = conversationId;
    const { data } = await api.post('/agent/chat', payload);
    return data.data;
  },
  getTools: async () => {
    const { data } = await api.get('/agent/tools');
    return data.data;
  },
  getMetrics: async () => {
    const { data } = await api.get('/agent/metrics');
    return data.data;
  },
  getGuardrailRules: async () => {
    const { data } = await api.get('/guardrails');
    return data.data;
  },
  updateGuardrailRule: async (id, updates) => {
    const { data } = await api.put(`/guardrails/${id}`, updates);
    return data.data;
  },
};

