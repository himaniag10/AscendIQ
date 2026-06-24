/**
 * AI Provider Service
 * Supports multiple providers with a prioritized fallback mechanism.
 * Priority: Groq -> Gemini -> OpenRouter
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const GROQ_MODEL = 'llama-3.3-70b-versatile';
const OPENROUTER_MODEL = 'meta-llama/llama-3-8b-instruct:free'; // Fallback to free meta-llama for OpenRouter if needed

// Keeps track of the active provider
let currentActiveProvider = 'Groq';

export function getActiveProvider() {
  return currentActiveProvider;
}

/**
 * Call Groq API
 */
export async function callGroq(prompt) {
  console.log("INSIDE GROQ SERVICE");
  console.log("process.env.GROQ_API_KEY exists:", !!process.env.GROQ_API_KEY);
  console.log("length:", process.env.GROQ_API_KEY?.length);

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured');

  const startTime = Date.now();
  console.log('[AI Provider] Attempting Groq...');
  console.log('Creating Groq client...');

  console.log('PROVIDER_SELECTED');
  console.log('MODEL_USED:', GROQ_MODEL);
  console.log('PROMPT_SENT');
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 1024
    })
  });
  console.log('RESPONSE_RECEIVED');

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API Error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data.choices[0]?.message?.content;
  if (!text) throw new Error('No text returned from Groq');

  console.log(`[AI Provider] Groq Success. Time: ${Date.now() - startTime}ms. Tokens: ${data.usage?.total_tokens || 'Unknown'}`);
  return text.trim();
}

/**
 * Call Gemini API
 */
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const startTime = Date.now();
  console.log('[AI Provider] Attempting Gemini...');

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

  console.log('PROVIDER_SELECTED');
  console.log('MODEL_USED: gemini-2.5-flash');
  console.log('PROMPT_SENT');
  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });
  console.log('RESPONSE_RECEIVED');

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No text returned from Gemini');

  console.log(`[AI Provider] Gemini Success. Time: ${Date.now() - startTime}ms.`);
  return text.trim();
}

/**
 * Call OpenRouter API
 */
async function callOpenRouter(prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not configured');

  const startTime = Date.now();
  console.log('[AI Provider] Attempting OpenRouter...');

  console.log('PROVIDER_SELECTED');
  console.log('MODEL_USED:', OPENROUTER_MODEL);
  console.log('PROMPT_SENT');
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://ascendiq.app',
      'X-Title': 'AscendIQ'
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 1024
    })
  });
  console.log('RESPONSE_RECEIVED');

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API Error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data.choices[0]?.message?.content;
  if (!text) throw new Error('No text returned from OpenRouter');

  console.log(`[AI Provider] OpenRouter Success. Time: ${Date.now() - startTime}ms. Tokens: ${data.usage?.total_tokens || 'Unknown'}`);
  return text.trim();
}

/**
 * Unified generation with fallback logic
 */
async function generateContent(prompt) {
  console.log('Using Groq');
  try {
    currentActiveProvider = 'Groq';
    return await callGroq(prompt);
  } catch (groqError) {
    console.log('Groq failed');
    console.error(`Grok Error details: ${groqError.message}`);
    
    console.log('Switching to Gemini');
    try {
      currentActiveProvider = 'Gemini';
      return await callGemini(prompt);
    } catch (geminiError) {
      console.log('Gemini failed');
      console.error(`Gemini Error details: ${geminiError.message}`);
      
      console.log('Switching to OpenRouter');
      try {
        currentActiveProvider = 'OpenRouter';
        const result = await callOpenRouter(prompt);
        console.log('OpenRouter success');
        return result;
      } catch (openRouterError) {
        console.log('OpenRouter failed');
        console.error(`OpenRouter Error details: ${openRouterError.message}`);
        console.error(`[AI Provider] All providers failed.`);
        throw new Error(openRouterError.message);
      }
    }
  }
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
 */
export async function generateFirstQuestion(session) {
  const systemContext = buildSystemContext(session);
  const prompt = `${systemContext}

Start the interview now. Ask your first interview question. Ask ONLY the question — no greeting, no introduction, no explanation. Just the question itself.`;

  return await generateContent(prompt);
}

/**
 * Generate the next interviewer response (feedback + follow-up question).
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
- You MUST provide exactly ONE single question. NEVER combine multiple questions.
- Provide exactly 1 feedback statement and 1 next question. Maximum.
- Do NOT put any questions in the "feedback" string. The "feedback" MUST be a statement only.
- Do NOT wrap the response in markdown blocks. Just return raw JSON.`;

  try {
    const rawResponse = await generateContent(prompt);
    const cleanedJson = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedJson);
  } catch (error) {
    console.error('[AI Provider] JSON Parse Error or Generation Error (generateNextResponse):', error.message);
    return {
      feedback: "Interesting point.",
      nextQuestion: "Can you elaborate further?"
    };
  }
}

/**
 * Generate post-interview analysis.
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
    "completeness": <number 0-100>
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

  const rawResponse = await generateContent(prompt);
  try {
    const cleanedJson = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedJson);
  } catch (parseError) {
    console.error('[AI Provider] JSON Parse Error (generateInterviewAnalysis):', parseError.message);
    throw new Error(`Failed to parse analysis JSON: ${parseError.message}`);
  }
}

/**
 * Generate a personalized learning path.
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

  try {
    const rawResponse = await generateContent(prompt);
    const cleanedJson = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedJson);
    return parsed.learningPath || [];
  } catch (error) {
    console.error('[AI Provider] Error (generateLearningPath):', error.message);
    return ["Review recent interview feedback to identify areas for improvement."];
  }
}
