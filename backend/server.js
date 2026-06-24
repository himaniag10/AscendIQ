import './src/config/env.js';
import app from './src/app.js';
import connectDatabase from './src/config/db.js';


const PORT = process.env.PORT || 5000;

console.log("\n========== AI PROVIDERS ==========");
console.log(`Groq: ${process.env.GROQ_API_KEY ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
console.log(`Gemini: ${process.env.GEMINI_API_KEY ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
console.log(`OpenRouter: ${process.env.OPENROUTER_API_KEY ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
console.log("==================================\n");

if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY missing from environment variables");
}

// Initialize Database connection placeholder
await connectDatabase();

const server = app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(`  Server is running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`  Listening on port: ${PORT}`);
  console.log(`  Health check: http://localhost:${PORT}/api/health`);
  console.log(`=============================================`);
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
