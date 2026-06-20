import express from 'express';
import {
  createSession,
  getMySessions,
  getSession,
  updateSessionStatus,
  startInterview,
  sendMessage,
  getMessages,
} from '../controllers/interview.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All interview routes require authentication
router.use(protect);

router.post('/session', createSession);
router.post('/start', startInterview);
router.get('/sessions', getMySessions);
router.get('/session/:id', getSession);
router.patch('/session/:id/status', updateSessionStatus);

// Conversational interview engine
router.post('/:sessionId/message', sendMessage);
router.get('/:sessionId/messages', getMessages);

export default router;
