
import supabase from '../config/supabase.js';
import crypto from 'crypto';

const mockConversations = [];

export class ConversationRepository {
  async createConversation(data) {
    if (!supabase) {
      const newConv = { id: data.id || crypto.randomUUID(), ...data, created_at: new Date() };
      mockConversations.push(newConv);
      return newConv;
    }
    const { data: res, error } = await supabase.from('conversations').insert(data).select().single();
    if (error) {
      console.error(`[Supabase Error] Table: conversations, Operation: INSERT, Code: ${error.code}, Message: ${error.message}`);
      return null; // Best effort fallback
    }
    return res;
  }

  async getConversationById(id) {
    if (!supabase) return mockConversations.find(c => c.id === id);
    const { data, error } = await supabase.from('conversations').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') {
      console.error(`[Supabase Error] Table: conversations, Operation: SELECT (ById), Code: ${error.code}, Message: ${error.message}`);
      return null; // Best effort fallback
    }
    return data;
  }

  async getAllConversations(page = 1, limit = 10) {
    if (!supabase) {
      const userConvs = [...mockConversations];
      userConvs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const start = (page - 1) * limit;
      return userConvs.slice(start, start + limit);
    }
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    if (error) {
      console.error(`[Supabase Error] Table: conversations, Operation: SELECT (List), Code: ${error.code}, Message: ${error.message}`);
      return []; // Best effort fallback
    }
    return data;
  }

  async deleteConversation(id) {
    if (!supabase) {
      const idx = mockConversations.findIndex(c => c.id === id);
      if (idx > -1) mockConversations.splice(idx, 1);
      return;
    }
    const { error } = await supabase.from('conversations').delete().eq('id', id);
    if (error) {
      console.error(`[Supabase Error] Table: conversations, Operation: DELETE, Code: ${error.code}, Message: ${error.message}`);
      return false; // Best effort fallback
    }
  }
}

export const conversationRepository = new ConversationRepository();
