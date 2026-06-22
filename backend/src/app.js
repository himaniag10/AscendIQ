import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import routes from './routes/index.routes.js';
import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import interviewRoutes from './routes/interview.routes.js';
import aiRoutes from './routes/ai.routes.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// Security HTTP headers
app.use(helmet());

// Enable CORS
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: corsOrigin === '*' ? true : corsOrigin,
  credentials: true
}));

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parser
app.use(express.json());

// Routes
app.use('/', routes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/ai', aiRoutes);

// Handle undefined routes (404)
app.use('*', (req, res, next) => {
  const err = new Error(`Route ${req.originalUrl} not found`);
  err.statusCode = 404;
  err.status = 'fail';
  next(err);
});

// Global Error Handler
app.use(errorHandler);

export default app;
