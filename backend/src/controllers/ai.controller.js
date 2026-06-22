import { getActiveProvider } from '../services/aiProvider.service.js';

/**
 * GET /api/ai/status
 * Get the current status of the AI providers.
 */
export async function getAiStatus(req, res, next) {
  try {
    const activeProvider = getActiveProvider();
    res.status(200).json({
      success: true,
      primaryProvider: 'Groq',
      availableProviders: ['Groq', 'Gemini', 'OpenRouter'],
      activeProvider
    });
  } catch (err) {
    next(err);
  }
}
