import * as interviewService from '../services/interview.service.js';
import { generateFirstQuestion, generateNextResponse, generateInterviewAnalysis, generateLearningPath } from '../services/aiProvider.service.js';
import InterviewSession from '../models/interviewSession.model.js';
import InterviewMessage from '../models/interviewMessage.model.js';
import Profile from '../models/profile.model.js';

/**
 * POST /api/interview/session
 * Create a new interview session.
 */
export async function createSession(req, res, next) {
  try {
    const { mode, topic, difficulty, company, role, experienceLevel, round } = req.body;

    // Validate mode
    if (!mode || !['learning', 'placement'].includes(mode)) {
      return res.status(400).json({
        success: false,
        message: 'Mode must be "learning" or "placement".',
      });
    }

    // Learning mode validation
    if (mode === 'learning') {
      if (!topic || !topic.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Topic is required for Learning mode.',
        });
      }
      if (!difficulty || !['Beginner', 'Intermediate', 'Advanced'].includes(difficulty)) {
        return res.status(400).json({
          success: false,
          message: 'Difficulty must be Beginner, Intermediate, or Advanced.',
        });
      }
    }

    // Placement mode validation
    if (mode === 'placement') {
      if (!company || !company.trim()) {
        return res.status(400).json({ success: false, message: 'Company is required for Placement mode.' });
      }
      if (!role || !role.trim()) {
        return res.status(400).json({ success: false, message: 'Role is required for Placement mode.' });
      }
      if (!experienceLevel || !['Intern', 'Fresher', '1 Year', '2+ Years'].includes(experienceLevel)) {
        return res.status(400).json({ success: false, message: 'Experience level is required.' });
      }
      if (!round || !['Online Assessment', 'Technical Round', 'HR Round', 'System Design', 'Mixed'].includes(round)) {
        return res.status(400).json({ success: false, message: 'Interview round is required.' });
      }
    }

    const session = await interviewService.createSession(req.user._id, {
      mode,
      topic,
      difficulty,
      company,
      role,
      experienceLevel,
      round,
    });

    res.status(201).json({ success: true, session });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/interview/sessions
 * Get all sessions for the logged-in user.
 */
export async function getMySessions(req, res, next) {
  try {
    const sessions = await interviewService.getSessionsByUser(req.user._id);
    res.status(200).json({ success: true, sessions });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/interview/session/:id
 * Get a single session.
 */
export async function getSession(req, res, next) {
  try {
    const session = await interviewService.getSessionById(req.params.id, req.user._id);
    res.status(200).json({ success: true, session });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/interview/session/:id/status
 * Update the status of a session.
 */
export async function updateSessionStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
    }
    const session = await interviewService.updateSessionStatus(req.params.id, req.user._id, status);
    res.status(200).json({ success: true, session });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/interview/start
 * Starts the mock interview by generating the first question and scheduling the session.
 */
export async function startInterview(req, res, next) {
  try {
    const { sessionId, mode, topic, difficulty, company, role, experienceLevel, round } = req.body;

    let session;

    if (sessionId) {
      session = await InterviewSession.findOne({ _id: sessionId, userId: req.user._id });
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Interview session not found.',
        });
      }
    } else {
      // Validate mode
      if (!mode || !['learning', 'placement'].includes(mode)) {
        return res.status(400).json({
          success: false,
          message: 'Mode must be "learning" or "placement".',
        });
      }

      // Learning mode validation
      if (mode === 'learning') {
        if (!topic || !topic.trim()) {
          return res.status(400).json({
            success: false,
            message: 'Topic is required for Learning mode.',
          });
        }
        if (!difficulty || !['Beginner', 'Intermediate', 'Advanced'].includes(difficulty)) {
          return res.status(400).json({
            success: false,
            message: 'Difficulty must be Beginner, Intermediate, or Advanced.',
          });
        }
      }

      // Placement mode validation
      if (mode === 'placement') {
        if (!company || !company.trim()) {
          return res.status(400).json({ success: false, message: 'Company is required for Placement mode.' });
        }
        if (!role || !role.trim()) {
          return res.status(400).json({ success: false, message: 'Role is required for Placement mode.' });
        }
        if (!experienceLevel || !['Intern', 'Fresher', '1 Year', '2+ Years'].includes(experienceLevel)) {
          return res.status(400).json({ success: false, message: 'Experience level is required.' });
        }
        if (!round || !['Online Assessment', 'Technical Round', 'HR Round', 'System Design', 'Mixed'].includes(round)) {
          return res.status(400).json({ success: false, message: 'Interview round is required.' });
        }
      }

      session = new InterviewSession({
        userId: req.user._id,
        mode,
        topic: topic || '',
        difficulty: difficulty || '',
        company: company || '',
        role: role || '',
        experienceLevel: experienceLevel || '',
        round: round || '',
      });
    }

    // Call Gemini to generate the first question (with graceful error handling & 503 response)
    let firstQuestion;
    try {
      firstQuestion = await generateFirstQuestion(session);
    } catch (aiErr) {
      console.error('AI error during interview start:', aiErr);
      return res.status(503).json({
        success: false,
        message: `Unable to start interview: ${aiErr.message}`,
      });
    }

    session.status = 'scheduled';
    session.startedAt = new Date();
    session.firstQuestion = firstQuestion;
    await session.save();

    // Store first question as message #1
    await InterviewMessage.create({
      sessionId: session._id,
      role: 'ai',
      content: firstQuestion,
      sequenceNumber: 1,
    });

    res.status(200).json({
      success: true,
      sessionId: session._id,
      firstQuestion,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/interview/:sessionId/message
 * Receives a candidate answer, generates the next AI response, stores both, returns AI reply.
 */
export async function sendMessage(req, res, next) {
  try {
    const { sessionId } = req.params;
    const { candidateAnswer, conversationHistory = [] } = req.body;

    if (!candidateAnswer || !candidateAnswer.trim()) {
      return res.status(400).json({ success: false, message: 'candidateAnswer is required.' });
    }

    const session = await InterviewSession.findOne({ _id: sessionId, userId: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Interview session not found.' });
    }

    // Count existing messages to assign sequence numbers
    const existingCount = await InterviewMessage.countDocuments({ sessionId });

    // Save candidate answer
    await InterviewMessage.create({
      sessionId,
      role: 'candidate',
      content: candidateAnswer.trim(),
      sequenceNumber: existingCount + 1,
    });

    // Generate AI follow-up via Gemini
    let aiResponseObj;
    try {
      aiResponseObj = await generateNextResponse(session, conversationHistory, candidateAnswer.trim());
    } catch (aiErr) {
      console.error('AI error during sendMessage:', aiErr);
      return res.status(503).json({
        success: false,
        message: 'AI service temporarily unavailable. Please try again.',
      });
    }

    const combinedText = `${aiResponseObj.feedback} ${aiResponseObj.nextQuestion}`;

    // Save AI response
    await InterviewMessage.create({
      sessionId,
      role: 'ai',
      content: combinedText,
      sequenceNumber: existingCount + 2,
    });

    res.status(200).json({ 
      success: true, 
      aiResponse: combinedText,
      feedback: aiResponseObj.feedback,
      nextQuestion: aiResponseObj.nextQuestion
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/interview/:sessionId/messages
 * Fetch all stored conversation messages for a session.
 */
export async function getMessages(req, res, next) {
  try {
    const { sessionId } = req.params;
    const session = await InterviewSession.findOne({ _id: sessionId, userId: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Interview session not found.' });
    }
    const messages = await InterviewMessage.find({ sessionId }).sort({ sequenceNumber: 1 });
    res.status(200).json({ success: true, messages });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/interview/:sessionId/analyze
 * Analyzes completed interview, generates readiness score & weaknesses, and updates Profile learning path.
 */
export async function analyzeInterview(req, res, next) {
  try {
    const { sessionId } = req.params;
    const session = await InterviewSession.findOne({ _id: sessionId, userId: req.user._id });
    
    if (!session) {
      return res.status(404).json({ success: false, message: 'Interview session not found.' });
    }
    
    if (session.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Session is not completed yet.' });
    }

    // Check if already analyzed to prevent duplicate aggregation
    if (session.readiness && session.readiness.overallScore > 0) {
      return res.status(200).json({ success: true, session });
    }

    // Fetch full conversation
    const messages = await InterviewMessage.find({ sessionId }).sort({ sequenceNumber: 1 });
    
    // 1. Generate Interview Analysis
    let analysis;
    try {
      analysis = await generateInterviewAnalysis(session, messages);
    } catch (analysisErr) {
      console.error('[Controller] generateInterviewAnalysis failed, using fallback:', analysisErr);
      analysis = {
        readiness: {
          technicalAccuracy: 50,
          communication: 50,
          confidence: 50,
          completeness: 50,
          overallScore: 50
        },
        feedback: {
          strengths: ["Completed the interview session."],
          weaknesses: ["Detailed analysis unavailable due to service limits."],
          improvementAreas: ["Review your answers manually from the transcript."]
        }
      };
    }
    
    // 2. Save Analysis to Session
    session.readiness = analysis.readiness;
    session.feedback = analysis.feedback;
    await session.save();

    // 3. Aggregate Stats to Profile
    const profile = await Profile.findOne({ user: req.user._id });
    if (profile) {
      profile.stats.interviewsCompleted += 1;
      profile.stats.currentStreak += 1; // Simplistic streak increment for now
      
      // Moving average for readiness
      const currentAvg = profile.stats.averageReadiness;
      const newScore = analysis.readiness.overallScore;
      const count = profile.stats.interviewsCompleted;
      profile.stats.averageReadiness = Math.round(((currentAvg * (count - 1)) + newScore) / count);

      // Append new weaknesses uniquely
      const newWeaknesses = analysis.feedback.weaknesses || [];
      const updatedWeaknesses = new Set([...profile.weaknesses, ...newWeaknesses]);
      profile.weaknesses = Array.from(updatedWeaknesses);

      // 4. Generate Learning Path based on aggregated weaknesses
      const newPath = await generateLearningPath(profile.weaknesses);
      profile.learningPath = newPath;

      await profile.save();
    }

    res.status(200).json({ success: true, session });
  } catch (err) {
    console.error('Error in analyzeInterview:', err);
    next(err);
  }
}
