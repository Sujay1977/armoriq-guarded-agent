/**
 * @fileoverview Agent Routes
 */
import express from 'express';
import { chat, listTools, getMetrics } from '../../controllers/agent.controller.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP/user to 10 requests per window
  message: { success: false, error: { message: 'Too many requests to the AI service. Please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// All agent routes require AI-specific rate limiting
router.post('/chat', aiRateLimiter, chat);

// MCP tool discovery (no rate limit needed — read-only metadata)
router.get('/tools', listTools);

// Guard metrics for dashboard
router.get('/metrics', getMetrics);

export default router;

