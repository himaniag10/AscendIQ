import express from 'express';
import {
  createSession,
  getMySessions,
  getSession,
  updateSessionStatus,
  startInterview,
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

export default router;
