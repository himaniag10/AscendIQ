import express from 'express';
import {
  register,
  login,
  getMe,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
  googleLogin,
} from '../controllers/auth.controller.js';
import {
  validateRegister,
  validateLogin,
  validateVerifyOTP,
  validateResendOTP,
  validateForgotPassword,
  validateResetPassword,
  validateGoogleLogin,
} from '../validators/auth.validator.js';
import { protect } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// -----------------------------------------------------------
// Public Routes (no JWT required)
// -----------------------------------------------------------

// POST /api/auth/register — Create account + dispatch OTP email
router.post('/register', validateRegister, register);

// POST /api/auth/login — Authenticate + receive JWT
router.post('/login', authLimiter, validateLogin, login);

// POST /api/auth/verify-otp — Verify account with 6-digit OTP
router.post('/verify-otp', authLimiter, validateVerifyOTP, verifyOTP);

// POST /api/auth/resend-otp — Resend verification OTP
router.post('/resend-otp', authLimiter, validateResendOTP, resendOTP);

// POST /api/auth/forgot-password — Request password recovery OTP
router.post('/forgot-password', authLimiter, validateForgotPassword, forgotPassword);

// POST /api/auth/reset-password — Reset password using email and OTP
router.post('/reset-password', authLimiter, validateResetPassword, resetPassword);
router.post('/google-login', authLimiter, validateGoogleLogin, googleLogin);

// -----------------------------------------------------------
// Protected Routes (valid JWT required)
// -----------------------------------------------------------

// GET /api/auth/me — Get authenticated user's profile
router.get('/me', protect, getMe);

// GET /api/auth/protected-test — Smoke test for JWT protection
router.get('/protected-test', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'You have accessed a protected route!',
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
    },
  });
});

export default router;
