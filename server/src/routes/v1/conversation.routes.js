
import express from 'express';
import { getConversations, getConversationDetails, deleteConversation } from '../../controllers/conversation.controller.js';

const router = express.Router();

router.get('/', getConversations);
router.get('/:conversationId', getConversationDetails);
router.delete('/:conversationId', deleteConversation);

export default router;
