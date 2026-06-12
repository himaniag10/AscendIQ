import * as authService from '../services/auth.service.js';

// -----------------------------------------------------------
// Helper: Format user object for API response
// Strips internal fields and returns only safe, public data.
// -----------------------------------------------------------
const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  role: user.role,
  isVerified: user.isVerified,
  authProvider: user.authProvider,
  createdAt: user.createdAt,
});

// -----------------------------------------------------------
// @desc    Register a new user + send email verification OTP
// @route   POST /api/auth/register
// @access  Public
// -----------------------------------------------------------
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const user = await authService.registerUser(name, email, password);

    res.status(201).json({
      success: true,
      message: 'Account created. Please check your email for the 6-digit verification code.',
      user: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// -----------------------------------------------------------
// @desc    Login user with email and password
// @route   POST /api/auth/login
// @access  Public
// -----------------------------------------------------------
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await authService.loginUser(email, password);
    const token = authService.generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// -----------------------------------------------------------
// @desc    Get current authenticated user's profile
// @route   GET /api/auth/me
// @access  Private (requires valid JWT via protect middleware)
// -----------------------------------------------------------
export const getMe = async (req, res, next) => {
  try {
    // req.user is populated by the protect middleware
    res.status(200).json({
      success: true,
      user: formatUser(req.user),
    });
  } catch (error) {
    next(error);
  }
};

// -----------------------------------------------------------
// @desc    Verify account using 6-digit OTP
// @route   POST /api/auth/verify-otp
// @access  Public
// -----------------------------------------------------------
export const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await authService.verifyOTP(email, otp);
    const token = authService.generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. Welcome to AscendIQ!',
      token,
      user: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// -----------------------------------------------------------
// @desc    Resend a new OTP to the user's email
// @route   POST /api/auth/resend-otp
// @access  Public
// -----------------------------------------------------------
export const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    await authService.resendOTP(email);

    res.status(200).json({
      success: true,
      message: 'A new verification code has been sent to your email.',
    });
  } catch (error) {
    next(error);
  }
};

// -----------------------------------------------------------
// @desc    Send password reset link to user's email
// @route   POST /api/auth/forgot-password
// @access  Public
// -----------------------------------------------------------
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    // Pass the request host so the reset URL is built correctly
    const host = req.get('host');

    await authService.forgotPassword(email, host);

    res.status(200).json({
      success: true,
      message: 'Password reset instructions have been sent to your email.',
    });
  } catch (error) {
    next(error);
  }
};

// -----------------------------------------------------------
// @desc    Reset password using token from email link
// @route   POST /api/auth/reset-password/:token
// @access  Public (token acts as temporary credential)
// -----------------------------------------------------------
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await authService.resetPassword(token, password);
    const jwtToken = authService.generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully.',
      token: jwtToken,
      user: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
};
