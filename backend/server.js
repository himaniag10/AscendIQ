import './src/config/env.js';
import app from './src/app.js';
import connectDatabase from './src/config/db.js';
import { validateEnv } from './src/utils/envValidator.js';

// Validate environment variables before doing anything else
validateEnv();

const PORT = process.env.PORT || 5000;

// Initialize Database connection
await connectDatabase();

const server = app.listen(PORT, () => {
  console.log(`\n==================================`);
  console.log(`AscendIQ Backend`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Port: ${PORT}`);
  console.log(`MongoDB: Connected`);
  console.log(`Cloudinary: Connected`);
  console.log(`SMTP: Connected`);
  console.log(`AI Providers: Ready`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`==================================\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down gracefully...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down gracefully...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Graceful Shutdown on SIGTERM (Render) and SIGINT (local)
const gracefulShutdown = () => {
  console.log('SIGTERM/SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    // Mongoose handles connection closing via mongoose.connection.close
    import('mongoose').then(({ default: mongoose }) => {
      mongoose.connection.close(false).then(() => {
        console.log('MongoDB connection closed.');
        process.exit(0);
      });
    });
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
