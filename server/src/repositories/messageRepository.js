
import supabase from '../config/supabase.js';
import crypto from 'crypto';

const mockMessages = [];

export class MessageRepository {
  async saveMessage(data) {
    if (!supabase) {
      const newMsg = { id: crypto.randomUUID(), ...data, created_at: new Date() };
      mockMessages.push(newMsg);
      return newMsg;
    }
    const { data: res, error } = await supabase.from('messages').insert(data).select().single();
    if (error) {
      console.error(`[Supabase Error] Table: messages, Operation: INSERT, Code: ${error.code}, Message: ${error.message}`);
      return null; // Best effort fallback
    }
    return res;
  }

  async getMessagesByConversation(conversationId) {
    if (!supabase) {
      const convMsgs = mockMessages.filter(m => m.conversation_id === conversationId);
      convMsgs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      return convMsgs;
    }
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) {
      console.error(`[Supabase Error] Table: messages, Operation: SELECT (ByConversation), Code: ${error.code}, Message: ${error.message}`);
      return []; // Best effort fallback
    }
    return data;
  }
}

export const messageRepository = new MessageRepository();
