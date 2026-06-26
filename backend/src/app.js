import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';

import routes from './routes/index.routes.js';
import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import interviewRoutes from './routes/interview.routes.js';
import aiRoutes from './routes/ai.routes.js';
import goalRoutes from './routes/goal.routes.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// Trust proxy required for secure cookies on Render
app.set('trust proxy', 1);

// Security HTTP headers
app.use(helmet());

// Enable CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "https://ascend-mock-interview.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parser (with payload limit)
app.use(express.json({ limit: '10kb' }));

// Compression
app.use(compression());

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    database: 'connected',
    uptime: process.uptime()
  });
});

// Routes
app.use('/', routes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/goals', goalRoutes);

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
