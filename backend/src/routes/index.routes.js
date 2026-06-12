import express from 'express';

const router = express.Router();

/**
 * Health check / Root API status route
 * GET /
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AscendIQ API running'
  });
});

export default router;
