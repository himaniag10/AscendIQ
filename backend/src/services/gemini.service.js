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
    console.error('[Gemini] Error: GEMINI_API_KEY is not configured in the environment.');
    throw new Error('GEMINI_API_KEY is not configured in the environment.');
  }

  console.log('[Gemini] Initialization: API Key is present.');

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
      stopSequences: [],
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    ],
  };

  console.log(`[Gemini] Request sent to ${GEMINI_API_URL}`);

  let response;
  try {
    response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
  } catch (networkError) {
    console.error('[Gemini] Network error during fetch:', networkError);
    throw new Error(`Network error calling Gemini: ${networkError.message}`);
  }

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[Gemini] Error Response (Status: ${response.status}):`, errorBody);
    throw new Error(`Gemini API returned status ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  console.log('[Gemini] Response received successfully.');

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.error('[Gemini] Parsing Error: No text found in response data:', JSON.stringify(data));
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
- You MUST follow exactly this format: 1 short feedback statement about the answer, followed immediately by 1 next question. Maximum.
- Use brief, professional acknowledgments like "Good answer.", "Interesting.", "That's a strong point.", "You're close, but not quite."
- You progressively increase question difficulty.
- You cross-question on weak or vague answers.
- You NEVER say you are an AI. You behave as a real human interviewer.
- Keep responses concise — strictly one short acknowledgment sentence + one follow-up question.`;
  }

  return `You are a professional technical interviewer conducting a placement interview at ${session.company} for the role of ${session.role}.
Experience Level Required: ${session.experienceLevel}
Interview Round: ${session.round}

Your personality and rules:
- You are experienced, professional, and conversational — as expected in a real ${session.company} interview.
- You ask ONE question at a time. Never ask multiple questions in the same message.
- You MUST follow exactly this format: 1 short feedback statement about the answer, followed immediately by 1 next question. Maximum.
- Use brief, professional acknowledgments like "Good answer.", "Interesting.", "That's a strong point.", "You're close, but not quite."
- You ask company-relevant questions and gradually increase difficulty.
- You cross-question on weak or vague answers.
- You NEVER say you are an AI. You behave as a real human interviewer.
- Keep responses concise — strictly one short acknowledgment sentence + one follow-up question.`;
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

  console.log('[Gemini] Prompt generated for generateFirstQuestion.');

  try {
    return await callGemini(prompt);
  } catch (error) {
    console.error('[Gemini] Error (generateFirstQuestion):', error.message);
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

Now respond as the interviewer. You MUST return your response as a valid JSON object ONLY, with exactly two keys:
{
  "feedback": "A single brief acknowledgment or professional evaluation of the candidate's answer (e.g., 'That is correct.').",
  "nextQuestion": "Exactly ONE follow-up interview question."
}
CRITICAL RULES:
- Never ask two questions in the nextQuestion string.
- Provide exactly 1 feedback statement and 1 next question. Maximum.
- Do NOT wrap the response in markdown blocks. Just return raw JSON.`;

  console.log('[Gemini] Prompt generated for generateNextResponse.');

  try {
    const rawResponse = await callGemini(prompt);
    try {
      const cleanedJson = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleanedJson);
    } catch (parseError) {
      console.error('[Gemini] JSON Parse Error (generateNextResponse):', parseError.message);
      // Fallback response if Gemini hallucinates non-JSON
      return {
        feedback: "Interesting point.",
        nextQuestion: "Can you elaborate further?"
      };
    }
  } catch (error) {
    console.error('[Gemini] Error (generateNextResponse):', error.message);
    throw new Error(`Failed to generate follow-up response: ${error.message}`);
  }
}

/**
 * Generate post-interview analysis: readiness scores and strengths/weaknesses.
 * @param {Object} session - The InterviewSession document.
 * @param {Array}  conversationHistory - Array of {role, content} objects.
 * @returns {Promise<Object>} - Parsed JSON object containing readiness and feedback.
 */
export async function generateInterviewAnalysis(session, conversationHistory) {
  const systemContext = buildSystemContext(session);
  const conversationBlock = buildConversationBlock(conversationHistory);

  const prompt = `${systemContext}
${conversationBlock}

The interview has now concluded. You are an expert interview evaluator.
Based on the candidate's answers in the transcript above, generate a detailed evaluation.
You MUST respond with ONLY valid JSON. Do not include any markdown formatting like \`\`\`json or \`\`\`.

The JSON must exactly match this structure:
{
  "readiness": {
    "technicalAccuracy": <number 0-100>,
    "communication": <number 0-100>,
    "confidence": <number 0-100>,
    "completeness": <number 0-100>,
    "overallScore": <number 0-100>
  },
  "feedback": {
    "strengths": ["<strength 1>", "<strength 2>"],
    "weaknesses": ["<weakness 1>", "<weakness 2>"],
    "improvementAreas": ["<area 1>", "<area 2>"]
  }
}

Guidelines for scoring:
- Base the scores strictly on the provided transcript.
- If the transcript is very short or the candidate didn't say much, score accordingly (lower).
- Provide 2-3 items for each array in feedback.
`;

  console.log('[Gemini] Prompt generated for generateInterviewAnalysis.');

  try {
    const rawResponse = await callGemini(prompt);
    try {
      // Remove potential markdown code blocks
      const cleanedJson = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleanedJson);
    } catch (parseError) {
      console.error('[Gemini] JSON Parse Error (generateInterviewAnalysis):', parseError.message);
      throw new Error(`Failed to parse analysis JSON: ${parseError.message}`);
    }
  } catch (error) {
    console.error('[Gemini] Error (generateInterviewAnalysis):', error.message);
    throw new Error(`Failed to generate interview analysis: ${error.message}`);
  }
}

/**
 * Generate a personalized learning path based on accumulated weaknesses.
 * @param {Array<string>} weaknesses - List of all weaknesses gathered from past interviews.
 * @returns {Promise<Array<string>>} - Array of actionable learning steps.
 */
export async function generateLearningPath(weaknesses) {
  if (!weaknesses || weaknesses.length === 0) {
    return ["Complete your first interview to get a personalized learning path."];
  }

  const prompt = `You are an expert career coach and technical mentor.
A candidate has shown the following weaknesses across their mock interviews:
- ${weaknesses.join('\n- ')}

Based on these weaknesses, generate a personalized, step-by-step learning path.
Provide exactly 3 to 5 actionable steps.
Each step should be concise (e.g., "Revise DBMS Normalization", "Practice SQL Indexing", "Do 5 LeetCode Easy Array problems").

You MUST respond with ONLY valid JSON. Do not include any markdown formatting.
The JSON must exactly match this structure:
{
  "learningPath": ["<step 1>", "<step 2>", "<step 3>"]
}`;

  console.log('[Gemini] Prompt generated for generateLearningPath.');

  try {
    const rawResponse = await callGemini(prompt);
    const cleanedJson = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedJson);
    return parsed.learningPath || [];
  } catch (error) {
    console.error('[Gemini] Error (generateLearningPath):', error.message);
    // Return a fallback rather than breaking the whole flow
    return ["Review recent interview feedback to identify areas for improvement."];
  }
}

