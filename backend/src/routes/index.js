import express from 'express';
const router = express.Router();

// Health check route placeholder
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'AscendIQ API is up and running!',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

export default router;
