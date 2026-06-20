/**
 * Gemini AI Service
 * Uses the Gemini REST API directly (no SDK required, compatible with Node 18+).
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Generate the first interview question using Gemini AI based on session details.
 * @param {Object} session - The interview session document.
 * @returns {Promise<string>} - The generated question text.
 */
export async function generateFirstQuestion(session) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the environment.');
  }

  let prompt = '';
  if (session.mode === 'learning') {
    prompt = `You are a professional technical interviewer conducting a mock interview.
Topic: ${session.topic}
Difficulty: ${session.difficulty}

Ask only ONE opening interview question. Be direct and professional. Do not explain the question or add any conversational introduction/commentary. Just ask the question itself.`;
  } else if (session.mode === 'placement') {
    prompt = `You are a professional technical interviewer conducting a mock interview for ${session.company} for the role of ${session.role}.
Experience Level: ${session.experienceLevel}
Interview Round: ${session.round}

Ask only ONE opening interview question suitable for this company, role, experience level, and round. Be direct and professional. Do not explain the question or add any conversational introduction/commentary. Just ask the question itself.`;
  } else {
    throw new Error('Invalid interview mode.');
  }

  const requestBody = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 256,
    },
  };

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Gemini API error response:', errorBody);
      throw new Error(`Gemini API returned status ${response.status}: ${errorBody}`);
    }

    const data = await response.json();

    // Extract the generated text from the response
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('No text returned from Gemini API response.');
    }

    return text.trim();
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error(`Failed to generate interview question: ${error.message}`);
  }
}
