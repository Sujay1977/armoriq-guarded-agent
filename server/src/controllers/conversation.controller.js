
import { conversationRepository } from '../repositories/conversationRepository.js';
import { messageRepository } from '../repositories/messageRepository.js';

export const getConversations = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const conversations = await conversationRepository.getAllConversations(page, limit);
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
      return res.json({ success: true, data: { conversation: { id: conversationId, title: 'Local Conversation' }, messages: [] } });
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

    await conversationRepository.deleteConversation(conversationId);
    res.json({ success: true, data: { message: 'Conversation deleted successfully' } });
  } catch (error) {
    next(error);
  }
};
