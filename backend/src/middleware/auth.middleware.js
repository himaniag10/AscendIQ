import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

// -----------------------------------------------------------
// Protect Middleware
// Verifies the JWT token from the Authorization header.
// If valid, loads the user from the database and attaches
// it to req.user so downstream controllers can access it.
// -----------------------------------------------------------
export const protect = async (req, res, next) => {
  try {
    let token;

    // Step 1: Extract token from Authorization header
    // Expected format: "Bearer <token>"
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      const error = new Error('Not authorized. No token provided.');
      error.statusCode = 401;
      throw error;
    }

    // Step 2: Verify the token using the secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Step 3: Find the user associated with the token's payload
    const user = await User.findById(decoded.id);

    if (!user) {
      const error = new Error('The user belonging to this token no longer exists.');
      error.statusCode = 401;
      throw error;
    }

    // Step 4: Attach user to the request object for use in controllers
    req.user = user;
    next();
  } catch (error) {
    // Handle JWT-specific errors with user-friendly messages
    if (error.name === 'JsonWebTokenError') {
      error.message = 'Invalid token. Please log in again.';
      error.statusCode = 401;
    }
    if (error.name === 'TokenExpiredError') {
      error.message = 'Your session has expired. Please log in again.';
      error.statusCode = 401;
    }
    next(error);
  }
};
