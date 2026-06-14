import jwt from 'jsonwebtoken';
import googleAuthPkg from 'google-auth-library';
const { OAuth2Client } = googleAuthPkg;
import crypto from 'crypto';
import User from '../models/user.model.js';
import sendEmail from '../utils/sendEmail.js';

// -----------------------------------------------------------
// Helper: Generate a secure 6-digit numeric OTP
// -----------------------------------------------------------
const generateNumericOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const hashOTP = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

const clearPasswordResetOTPFields = (user) => {
  user.passwordResetOtp = null;
  user.passwordResetOtpExpires = null;
  user.passwordResetOtpRequestedAt = null;
  user.passwordResetOtpFailedAttempts = 0;
};

const ensureLocalAuthProvider = (user) => {
  if (user.authProvider !== 'local') {
    const error = new Error('Cannot perform password recovery for a Google OAuth account.');
    error.statusCode = 400;
    throw error;
  }
};

// -----------------------------------------------------------
// Generate JWT Token
// Signs a token containing the userId as payload.
// -----------------------------------------------------------
export const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// -----------------------------------------------------------
// Register User
// Creates a user and generates/emails a 6-digit verification OTP.
// -----------------------------------------------------------
export const registerUser = async (name, email, password) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Check if a user with this email already exists
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error('An account with this email already exists.');
    error.statusCode = 409; // Conflict
    throw error;
  }

  // Generate 6-digit OTP and set 10-minute expiry
  const otp = generateNumericOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Create the user — password hashed via schema pre-save hook
  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    otp,
    otpExpires,
    isVerified: false,
  });

  // Dispatch OTP email
  const message = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
      <h2 style="color: #4f46e5; text-align: center;">Welcome to AscendIQ!</h2>
      <p>Thank you for signing up. Please verify your email address to activate your account.</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
        <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">${otp}</span>
      </div>
      <p style="color: #6b7280; font-size: 14px; text-align: center;">This code is valid for 10 minutes. If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  await sendEmail({
    email: user.email,
    subject: 'AscendIQ Email Verification Code',
    message,
  });

  return user;
};

// -----------------------------------------------------------
// Login User
// Blocks login if email is not verified.
// -----------------------------------------------------------
export const loginUser = async (email, password) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Explicitly select the password field (excluded by default for security)
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // Google OAuth users don't have a password
  if (user.authProvider !== 'local') {
    const error = new Error(`Please sign in using ${user.authProvider}.`);
    error.statusCode = 400;
    throw error;
  }

  // Compare password hash
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // Block login if email is not verified
  if (!user.isVerified) {
    const error = new Error('Please verify your email address to log in.');
    error.statusCode = 403; // Forbidden
    throw error;
  }

  return user;
};

const getPasswordResetUser = async (email, otp) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    const error = new Error('No account found with that email address.');
    error.statusCode = 404;
    throw error;
  }

  ensureLocalAuthProvider(user);

  if (!user.passwordResetOtp || !user.passwordResetOtpExpires || user.passwordResetOtpExpires < new Date()) {
    clearPasswordResetOTPFields(user);
    await user.save();

    const error = new Error('Invalid or expired password recovery code.');
    error.statusCode = 400;
    throw error;
  }

  if ((user.passwordResetOtpFailedAttempts || 0) >= 5) {
    clearPasswordResetOTPFields(user);
    await user.save();

    const error = new Error('Too many failed recovery attempts. Request a new code.');
    error.statusCode = 429;
    throw error;
  }

  const hashedOtp = hashOTP(otp);
  if (hashedOtp !== user.passwordResetOtp) {
    user.passwordResetOtpFailedAttempts = (user.passwordResetOtpFailedAttempts || 0) + 1;

    if (user.passwordResetOtpFailedAttempts >= 5) {
      clearPasswordResetOTPFields(user);
      await user.save();

      const error = new Error('Too many failed recovery attempts. Request a new code.');
      error.statusCode = 429;
      throw error;
    }

    await user.save();
    const error = new Error('Invalid recovery code. Please try again.');
    error.statusCode = 400;
    throw error;
  }

  user.passwordResetOtpFailedAttempts = 0;
  await user.save();
  return user;
};

export const verifyOTP = async (email, otp) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    const error = new Error('No account found with that email address.');
    error.statusCode = 404;
    throw error;
  }

  if (user.passwordResetOtp) {
    await getPasswordResetUser(email, otp);
    return { user, flow: 'passwordReset' };
  }

  if (user.isVerified) {
    return { user, flow: 'register' };
  }

  // Check registration OTP
  if (!user.otp || !user.otpExpires || user.otp !== otp || user.otpExpires < new Date()) {
    const error = new Error('Invalid or expired verification code.');
    error.statusCode = 400;
    throw error;
  }

  user.isVerified = true;
  user.otp = null;
  user.otpExpires = null;
  await user.save();

  return { user, flow: 'register' };
};

// -----------------------------------------------------------
// Resend Verification OTP
// Generates and sends a new verification OTP.
// -----------------------------------------------------------
export const resendOTP = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    const error = new Error('No account found with that email address.');
    error.statusCode = 404;
    throw error;
  }

  if (user.isVerified) {
    const error = new Error('This email address is already verified.');
    error.statusCode = 400;
    throw error;
  }

  // Generate new OTP and set 10-minute expiry
  const otp = generateNumericOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  user.otp = otp;
  user.otpExpires = otpExpires;
  await user.save();

  // Send the email
  const message = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
      <h2 style="color: #4f46e5; text-align: center;">Resend Verification Code</h2>
      <p>You requested a new verification code. Please use the following code to verify your email address:</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
        <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">${otp}</span>
      </div>
      <p style="color: #6b7280; font-size: 14px; text-align: center;">This code is valid for 10 minutes. If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  await sendEmail({
    email: user.email,
    subject: 'Your AscendIQ Verification Code',
    message,
  });

  return user;
};

// -----------------------------------------------------------
// Forgot Password - Request recovery OTP
// Generates and emails a secure 6-digit recovery code.
// -----------------------------------------------------------
export const forgotPassword = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    const error = new Error('No account found with that email address.');
    error.statusCode = 404;
    throw error;
  }

  if (user.authProvider !== 'local') {
    const error = new Error('Cannot reset password for a Google OAuth account.');
    error.statusCode = 400;
    throw error;
  }

  const otp = generateNumericOTP();
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  user.passwordResetOtp = hashedOtp;
  user.passwordResetOtpExpires = otpExpires;
  await user.save();

  const message = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
      <h2 style="color: #4f46e5; text-align: center;">Reset Your Password</h2>
      <p>We received a request to reset your password. Use the code below to complete the recovery process:</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
        <span style="font-size: 28px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">${otp}</span>
      </div>
      <p style="color: #6b7280; font-size: 14px; text-align: center;">This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
    </div>
  `;

  await sendEmail({
    email: user.email,
    subject: 'AscendIQ Password Recovery Code',
    message,
  });
};

// -----------------------------------------------------------
// Reset Password - Save New Password
// Verifies OTP against stored hash and updates password.
// -----------------------------------------------------------
export const resetPassword = async (email, otp, newPassword) => {
  const user = await getPasswordResetUser(email, otp);

  user.password = newPassword;
  clearPasswordResetOTPFields(user);
  await user.save();

  return user;
};

// -----------------------------------------------------------
// Google OAuth Login
// -----------------------------------------------------------
export const handleGoogleLogin = async (idToken) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    const error = new Error('Google OAuth is not configured. Set GOOGLE_CLIENT_ID on the backend.');
    error.statusCode = 500;
    throw error;
  }

  // Verify token with Google
  const client = new OAuth2Client();
  let ticket;
  try {
    ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
  } catch (err) {
    const error = new Error('Invalid Google ID token.');
    error.statusCode = 401;
    throw error;
  }
  const payload = ticket.getPayload();
  const { sub: googleId, email, name, picture } = payload;

  // Find existing user by googleId or email
  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (user) {
    // If existing user is not a Google account, optionally link accounts (not implemented)
    if (user.authProvider !== 'google') {
      const error = new Error('Account exists with different authentication method.');
      error.statusCode = 400;
      throw error;
    }
    // Update googleId if missing
    if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }
    // Ensure email is verified for Google accounts
    if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }
    return user;
  }

  // Create new Google user
  const newUser = await User.create({
    name: name || 'Google User',
    email: email.toLowerCase().trim(),
    authProvider: 'google',
    googleId,
    avatar: picture || '',
    isVerified: true,
  });
  return newUser;
};
// -----------------------------------------------------------
