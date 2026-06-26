/**
 * Validates required environment variables before starting the server.
 * Fails fast if any critical variable is missing.
 */
export const validateEnv = () => {
  const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
    'FRONTEND_URL',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'FROM_EMAIL',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'GROQ_API_KEY',
    'GEMINI_API_KEY',
    'OPENROUTER_API_KEY'
  ];

  const missingVars = requiredVars.filter((envVar) => !process.env[envVar]);

  if (missingVars.length > 0) {
    console.error(`\n[FATAL ERROR] Missing required environment variables:`);
    missingVars.forEach((envVar) => console.error(`  - ${envVar}`));
    console.error(`\nPlease set them in your .env file or environment variables before starting the server.\n`);
    process.exit(1);
  }
};
