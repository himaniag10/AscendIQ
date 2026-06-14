import express from 'express';
import {
	getMyProfile,
	updateMyProfile,
	uploadAvatar,
	uploadResume,
	deleteAvatar,
	deleteResume,
} from '../controllers/profile.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validateProfile } from '../validators/profile.validator.js';
import { uploadAvatar as multerUploadAvatar, uploadResume as multerUploadResume } from '../middleware/upload.middleware.js';

const router = express.Router();

// all profile routes require authentication
router.use(protect);

router.get('/me', getMyProfile);
router.put('/me', validateProfile, updateMyProfile);

// Uploads
router.post('/upload-avatar', multerUploadAvatar, uploadAvatar);
router.post('/upload-resume', multerUploadResume, uploadResume);

// Deletes
router.delete('/avatar', deleteAvatar);
router.delete('/resume', deleteResume);

export default router;
