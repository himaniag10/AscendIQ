import express from 'express';
import { getAiStatus, testGroq } from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/status', protect, getAiStatus);
router.get('/debug/groq', testGroq);

export default router;
