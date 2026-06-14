import express from 'express';
import { getMyProfile, updateMyProfile } from '../controllers/profile.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validateProfile } from '../validators/profile.validator.js';

const router = express.Router();

router.use(protect);

router.get('/me', getMyProfile);
router.put('/me', validateProfile, updateMyProfile);

export default router;
