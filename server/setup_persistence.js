import fs from 'fs';
import path from 'path';

// 1. Update schema.sql
const schemaPath = path.join(process.cwd(), 'schema.sql');
let schemaSql = fs.readFileSync(schemaPath, 'utf8');
schemaSql += `
-- Create Conversations Table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Messages Table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  content TEXT,
  tool_name VARCHAR(100),
  tool_input JSONB,
  tool_output JSONB,
  provider VARCHAR(100),
  route VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;
fs.writeFileSync(schemaPath, schemaSql);

// 2. Create conversationRepository.js
const repoDir = path.join(process.cwd(), 'src/repositories');
fs.writeFileSync(path.join(repoDir, 'conversationRepository.js'), `
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
    if (error) throw error;
    return res;
  }

  async getConversationById(id) {
    if (!supabase) return mockConversations.find(c => c.id === id);
    const { data, error } = await supabase.from('conversations').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error; // Handle null gracefully if missing
    return data;
  }

  async getUserConversations(userId, page = 1, limit = 10) {
    if (!supabase) {
      const userConvs = mockConversations.filter(c => c.user_id === userId);
      userConvs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const start = (page - 1) * limit;
      return userConvs.slice(start, start + limit);
    }
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    if (error) throw error;
    return data;
  }

  async deleteConversation(id) {
    if (!supabase) {
      const idx = mockConversations.findIndex(c => c.id === id);
      if (idx > -1) mockConversations.splice(idx, 1);
      return;
    }
    const { error } = await supabase.from('conversations').delete().eq('id', id);
    if (error) throw error;
  }
}

export const conversationRepository = new ConversationRepository();
`);

// 3. Create messageRepository.js
fs.writeFileSync(path.join(repoDir, 'messageRepository.js'), `
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
    if (error) throw error;
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
    if (error) throw error;
    return data;
  }
}

export const messageRepository = new MessageRepository();
`);

// 4. Create conversation.controller.js
const ctrlDir = path.join(process.cwd(), 'src/controllers');
fs.writeFileSync(path.join(ctrlDir, 'conversation.controller.js'), `
import { conversationRepository } from '../repositories/conversationRepository.js';
import { messageRepository } from '../repositories/messageRepository.js';

export const getConversations = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const conversations = await conversationRepository.getUserConversations(req.user.id, page, limit);
    res.json({ success: true, data: conversations });
  } catch (error) {
    next(error);
  }
};

export const getConversationDetails = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const conversation = await conversationRepository.getConversationById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ success: false, error: { message: 'Conversation not found' } });
    }

    if (conversation.user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const messages = await messageRepository.getMessagesByConversation(conversationId);
    res.json({ success: true, data: { conversation, messages } });
  } catch (error) {
    next(error);
  }
};

export const deleteConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const conversation = await conversationRepository.getConversationById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ success: false, error: { message: 'Conversation not found' } });
    }

    if (conversation.user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: { message: 'Unauthorized' } });
    }

    await conversationRepository.deleteConversation(conversationId);
    res.json({ success: true, data: { message: 'Conversation deleted successfully' } });
  } catch (error) {
    next(error);
  }
};
`);

// 5. Create conversation.routes.js
const routesDir = path.join(process.cwd(), 'src/routes/v1');
fs.writeFileSync(path.join(routesDir, 'conversation.routes.js'), `
import express from 'express';
import { getConversations, getConversationDetails, deleteConversation } from '../../controllers/conversation.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getConversations);
router.get('/:conversationId', getConversationDetails);
router.delete('/:conversationId', deleteConversation);

export default router;
`);

// 6. Mount in index.js
const indexRoutesPath = path.join(routesDir, 'index.js');
let indexRoutes = fs.readFileSync(indexRoutesPath, 'utf8');
indexRoutes = indexRoutes.replace("import agentRoutes from './agent.routes.js';", "import agentRoutes from './agent.routes.js';\\nimport conversationRoutes from './conversation.routes.js';");
indexRoutes = indexRoutes.replace("router.use('/agent', agentRoutes);", "router.use('/agent', agentRoutes);\\nrouter.use('/conversations', conversationRoutes);");
fs.writeFileSync(indexRoutesPath, indexRoutes);

console.log("Persistence setup completed successfully.");
