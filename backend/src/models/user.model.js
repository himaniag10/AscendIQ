import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    /**
     * name - The user's full name.
     * Required for personalized UI experiences and profile display.
     */
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },

    /**
     * email - The user's email address.
     * Used as the primary identifier for login.
     * Must be unique to prevent duplicate accounts.
     */
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },

    /**
     * password - Hashed user password.
     * select: false ensures it is NEVER returned in query results by default.
     * Only included when explicitly requested (e.g. during login verification).
     * Not required because Google OAuth users won't have one.
     */
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },

    /**
     * avatar - URL to the user's profile picture.
     * For local auth: can be set manually or left empty.
     * For Google OAuth: will be populated from Google profile data.
     */
    avatar: {
      type: String,
      default: '',
    },

    /**
     * authProvider - Identifies how the user authenticated.
     * 'local'  - Signed up with email and password.
     * 'google' - Signed up via Google OAuth (prepared for next phase).
     * Helps differentiate behavior (e.g. skip password checks for OAuth users).
     */
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },

    /**
     * googleId - Unique Google account identifier.
     * Populated when a user signs in via Google OAuth.
     * Used to find/link existing accounts during OAuth callback.
     * Not required for local email/password users.
     */
    googleId: {
      type: String,
      default: null,
    },

    /**
     * role - The user's access level within the application.
     * 'user'  - Standard user with basic access rights.
     * 'admin' - Elevated access for platform management.
     * Enables role-based access control (RBAC) for protected resources.
     */
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },

    /**
     * isVerified - Indicates if the user has verified their email address.
     * false by default until email verification is completed.
     * Prepared for email verification flow in a future phase.
     * Google OAuth users can be auto-verified since Google confirms emails.
     */
    isVerified: {
      type: Boolean,
      default: false,
    },

    /**
     * otp - One-Time Password for email verification.
     * Stored as a plain string since it is short-lived and numeric.
     */
    otp: {
      type: String,
      default: null,
    },

    /**
     * otpExpires - Expiration timestamp for the verification OTP.
     * Typically set to 10-15 minutes from generation.
     */
    otpExpires: {
      type: Date,
      default: null,
    },

    /**
     * passwordResetOtp - One-time numeric code for password recovery.
     * Stored temporarily until the password is successfully reset.
     */
    passwordResetOtp: {
      type: String,
      default: null,
    },

    /**
     * passwordResetOtpExpires - Expiration timestamp for the password recovery OTP.
     * Typically set to 10 minutes from generation.
     */
    passwordResetOtpExpires: {
      type: Date,
      default: null,
    },

    /**
     * passwordResetOtpRequestedAt - Time the current recovery OTP was generated.
     * Used to rate limit OTP requests and prevent duplicate emails.
     */
    passwordResetOtpRequestedAt: {
      type: Date,
      default: null,
    },

    /**
     * passwordResetOtpFailedAttempts - Number of invalid recovery OTP attempts.
     * Locks the current OTP after repeated failures.
     */
    passwordResetOtpFailedAttempts: {
      type: Number,
      default: 0,
    },
  },
  {
    // Automatically add createdAt and updatedAt timestamp fields
    timestamps: true,
  }
);

// -----------------------------------------------------------
// Pre-save Hook: Hash password before saving to database
// Only runs when the password field is new or modified.
// -----------------------------------------------------------
userSchema.pre('save', async function (next) {
  // Skip hashing if password hasn't been modified (e.g. updating name/email)
  if (!this.isModified('password') || !this.password) return next();

  // Hash the password with a cost factor of 12 (strong and secure)
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// -----------------------------------------------------------
// Instance Method: Compare candidate password with stored hash
// Called during login to verify the user's entered password.
// -----------------------------------------------------------
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
