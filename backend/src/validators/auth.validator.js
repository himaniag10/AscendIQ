/**
 * Auth Validators
 * Lightweight, dependency-free input validation middleware.
 * Validates incoming request bodies before they reach controllers.
 */

// -----------------------------------------------------------
// Validate Register Input
// -----------------------------------------------------------
export const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  // Name: required, min 2 chars
  if (!name || name.trim().length < 2) {
    errors.push('Name is required and must be at least 2 characters.');
  }

  // Email: required, valid format
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('A valid email address is required.');
  }

  // Password: required, min 6 chars
  if (!password || password.length < 6) {
    errors.push('Password is required and must be at least 6 characters.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
};

// -----------------------------------------------------------
// Validate Login Input
// -----------------------------------------------------------
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  // Email: required, valid format
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('A valid email address is required.');
  }

  // Password: required
  if (!password) {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
};

// -----------------------------------------------------------
// Validate Verify OTP Input
// -----------------------------------------------------------
export const validateVerifyOTP = (req, res, next) => {
  const { email, otp } = req.body;
  const errors = [];

  // Email: required, valid format
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('A valid email address is required.');
  }

  // OTP: required, exactly 6 digits
  const otpRegex = /^\d{6}$/;
  if (!otp || !otpRegex.test(otp)) {
    errors.push('Verification code must be exactly 6 digits.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
};

// -----------------------------------------------------------
// Validate Resend OTP Input
// -----------------------------------------------------------
export const validateResendOTP = (req, res, next) => {
  const { email } = req.body;
  const errors = [];

  // Email: required, valid format
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('A valid email address is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
};

// -----------------------------------------------------------
// Validate Forgot Password Input
// -----------------------------------------------------------
export const validateForgotPassword = (req, res, next) => {
  const { email } = req.body;
  const errors = [];

  // Email: required, valid format
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('A valid email address is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
};

// -----------------------------------------------------------
// Validate Reset Password Input
// -----------------------------------------------------------
export const validateResetPassword = (req, res, next) => {
  const { password } = req.body;
  const errors = [];

  if (!password || password.length < 6) {
    errors.push('New password is required and must be at least 6 characters.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
};

export const validateGoogleLogin = (req, res, next) => {
  const { idToken } = req.body;
  const errors = [];
  if (!idToken || typeof idToken !== 'string' || idToken.trim() === '') {
    errors.push('idToken is required for Google login.');
  }
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }
  next();
};


