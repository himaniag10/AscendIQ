import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/user.model.js';
import sendEmail from '../utils/sendEmail.js';

// -----------------------------------------------------------
// Helper: Generate a secure 6-digit numeric OTP
// -----------------------------------------------------------
const generateNumericOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
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

// -----------------------------------------------------------
// Verify OTP
// Verifies OTP and marks the account as verified.
// -----------------------------------------------------------
export const verifyOTP = async (email, otp) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    const error = new Error('No account found with that email address.');
    error.statusCode = 404;
    throw error;
  }

  if (user.isVerified) {
    return user; // Already verified
  }

  // Check if OTP matches and is not expired
  if (user.otp !== otp || user.otpExpires < new Date()) {
    const error = new Error('Invalid or expired verification code.');
    error.statusCode = 400;
    throw error;
  }

  // Update verification status and clear OTP fields
  user.isVerified = true;
  user.otp = null;
  user.otpExpires = null;
  await user.save();

  return user;
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
// Forgot Password - Request Reset Link
// Generates and emails a secure crypt reset token.
// -----------------------------------------------------------
export const forgotPassword = async (email, host) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    const error = new Error('No account found with that email address.');
    error.statusCode = 404;
    throw error;
  }

  if (user.authProvider !== 'local') {
    const error = new Error(`Cannot reset password for a Google OAuth account.`);
    error.statusCode = 400;
    throw error;
  }

  // Generate random crypto reset token
  const rawToken = crypto.randomBytes(32).toString('hex');

  // Store hashed version in DB for security
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const tokenExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = tokenExpires;
  await user.save();

  // Create reset link URL
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const resetUrl = `${protocol}://${host || 'localhost:5000'}/api/auth/reset-password/${rawToken}`;

  const message = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
      <h2 style="color: #4f46e5; text-align: center;">Reset Your Password</h2>
      <p>We received a request to reset your password. Click the button below to update your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p style="word-break: break-all; color: #6b7280; font-size: 14px;">If the button above does not work, copy and paste this URL into your browser:</p>
      <p style="word-break: break-all; color: #4f46e5; font-size: 14px;">${resetUrl}</p>
      <p style="color: #6b7280; font-size: 14px; border-top: 1px solid #f0f0f0; padding-top: 15px; margin-top: 20px;">This link is valid for 1 hour. If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
    </div>
  `;

  await sendEmail({
    email: user.email,
    subject: 'AscendIQ Password Reset Request',
    message,
  });

  return rawToken;
};

// -----------------------------------------------------------
// Reset Password - Save New Password
// Verifies raw token against stored hash and updates password.
// -----------------------------------------------------------
export const resetPassword = async (rawToken, newPassword) => {
  // Hash the raw token received from client
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  // Look up user with matching hashed token and unexpired reset time
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    const error = new Error('Invalid or expired password reset token.');
    error.statusCode = 400;
    throw error;
  }

  // Update password field (will be hashed automatically by pre-save hook!)
  user.password = newPassword;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  return user;
};

