/**
 * Gemini AI Service
 * Uses the Gemini REST API directly (no SDK required, compatible with Node 18+).
 */

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Internal: call Gemini REST API with a given prompt string.
 */
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the environment.');
  }

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 512,
      stopSequences: [],
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    ],
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Gemini API error response:', errorBody);
    throw new Error(`Gemini API returned status ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No text returned from Gemini API response.');
  }
  return text.trim();
}

/**
 * Build the system persona block based on session mode.
 */
function buildSystemContext(session) {
  if (session.mode === 'learning') {
    return `You are a professional technical interviewer conducting a mock interview.
Topic: ${session.topic}
Difficulty: ${session.difficulty}

Your personality and rules:
- You are experienced, professional, and conversational.
- You ask ONE question at a time. Never ask multiple questions in the same message.
- You react naturally to the candidate's answer before asking the next question.
- Use brief acknowledgments like "Good answer.", "Interesting.", "That's a strong point.", "You're on the right track.", "Let's explore that further.", "That's partially correct — let me push deeper."
- You progressively increase question difficulty.
- You cross-question on weak or vague answers.
- You NEVER say you are an AI. You behave as a real human interviewer.
- Keep responses concise — one short acknowledgment sentence + one follow-up question.`;
  }

  return `You are a professional technical interviewer conducting a placement interview at ${session.company} for the role of ${session.role}.
Experience Level Required: ${session.experienceLevel}
Interview Round: ${session.round}

Your personality and rules:
- You are experienced, professional, and conversational — as expected in a real ${session.company} interview.
- You ask ONE question at a time. Never ask multiple questions in the same message.
- You react naturally to the candidate's answer before asking the next question.
- Use brief acknowledgments like "Good answer.", "Interesting.", "That's a strong point.", "You're on the right track.", "Let's explore that further.", "That's partially correct — let me push deeper."
- You ask company-relevant questions and gradually increase difficulty.
- You cross-question on weak or vague answers.
- You NEVER say you are an AI. You behave as a real human interviewer.
- Keep responses concise — one short acknowledgment sentence + one follow-up question.`;
}

/**
 * Build the conversation history block for the prompt.
 */
function buildConversationBlock(history) {
  if (!history || history.length === 0) return '';
  const lines = history.map((msg) => {
    const label = msg.role === 'ai' ? 'Interviewer' : 'Candidate';
    return `${label}: ${msg.content}`;
  });
  return '\n\nConversation so far:\n' + lines.join('\n');
}

/**
 * Generate the first interview question.
 * Called when the interview starts.
 */
export async function generateFirstQuestion(session) {
  const systemContext = buildSystemContext(session);
  const prompt = `${systemContext}

Start the interview now. Ask your first interview question. Ask ONLY the question — no greeting, no introduction, no explanation. Just the question itself.`;

  try {
    return await callGemini(prompt);
  } catch (error) {
    console.error('Gemini error (generateFirstQuestion):', error);
    throw new Error(`Failed to generate first question: ${error.message}`);
  }
}

/**
 * Generate the next interviewer response (feedback + follow-up question).
 * Called after each candidate answer.
 *
 * @param {Object} session - The InterviewSession document.
 * @param {Array}  conversationHistory - Array of {role, content} objects.
 * @param {string} candidateAnswer - The latest candidate answer.
 * @returns {Promise<string>} - The AI's next response (acknowledgment + question).
 */
export async function generateNextResponse(session, conversationHistory, candidateAnswer) {
  const systemContext = buildSystemContext(session);
  const conversationBlock = buildConversationBlock(conversationHistory);

  const prompt = `${systemContext}
${conversationBlock}

Candidate's latest answer: "${candidateAnswer}"

Now respond as the interviewer:
- Give ONE brief acknowledgment sentence reacting to the candidate's answer.
- Then ask ONE follow-up question.
- Do NOT add any preamble like "As an interviewer..." or "Sure, I'll ask..."
- Format: just the acknowledgment and the question, nothing else.`;

  try {
    return await callGemini(prompt);
  } catch (error) {
    console.error('Gemini error (generateNextResponse):', error);
    throw new Error(`Failed to generate follow-up response: ${error.message}`);
  }
}
