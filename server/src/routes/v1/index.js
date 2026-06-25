/**
 * @fileoverview Main router for API v1
 */
import express from 'express';
import healthRoutes from './health.routes.js';
import agentRoutes from './agent.routes.js';
import conversationRoutes from './conversation.routes.js';
import guardrailRoutes from './guardrail.routes.js';

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/agent', agentRoutes);
router.use('/conversations', conversationRoutes);
router.use('/guardrails', guardrailRoutes);

export default router;
