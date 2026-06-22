import express from 'express';
import { getAiStatus } from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/status', protect, getAiStatus);

export default router;
