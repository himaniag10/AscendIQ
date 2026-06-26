import express from 'express';
import {
  createSession,
  getMySessions,
  getSession,
  updateSessionStatus,
  startInterview,
  sendMessage,
  getMessages,
  analyzeInterview,
} from '../controllers/interview.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All interview routes require authentication
router.use(protect);

router.post('/session', aiLimiter, createSession);
router.post('/start', aiLimiter, startInterview);
router.get('/sessions', getMySessions);
router.get('/session/:id', getSession);
router.patch('/session/:id/status', updateSessionStatus);

// Conversational interview engine
router.post('/:sessionId/message', aiLimiter, sendMessage);
router.get('/:sessionId/messages', getMessages);
router.post('/:sessionId/analyze', aiLimiter, analyzeInterview);

export default router;
