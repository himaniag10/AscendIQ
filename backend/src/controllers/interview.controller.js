import * as interviewService from '../services/interview.service.js';
import { generateFirstQuestion, generateNextResponse, generateInterviewAnalysis, generateLearningPath, getActiveProvider } from '../services/aiProvider.service.js';
import { calculateReadiness } from '../services/readinessEngine.js';
import InterviewSession from '../models/interviewSession.model.js';
import InterviewMessage from '../models/interviewMessage.model.js';
import Profile from '../models/profile.model.js';

/**
 * POST /api/interview/session
 * Create a new interview session.
 */
export async function createSession(req, res, next) {
  try {
    const { mode, topic, difficulty, company, role, experienceLevel, round, duration } = req.body;

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
      duration,
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
    res.status(200).json({ success: true, session, provider: getActiveProvider() });
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
    const { sessionId, mode, topic, difficulty, company, role, experienceLevel, round, duration } = req.body;

    console.log('INTERVIEW_STARTED');

    let session;

    if (sessionId) {
      session = await InterviewSession.findOne({ _id: sessionId, userId: req.user._id });
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Interview session not found.',
        });
      }
      if (duration && duration !== session.duration) {
         session.duration = duration;
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
        duration: duration || 15,
      });
    }

    // Call AI to generate the first question (with graceful error handling & 503 response)
    let firstQuestion;
    try {
      firstQuestion = await generateFirstQuestion(session);
      console.log('QUESTION_GENERATED');
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

    // Add to session transcript and questions
    session.questions = [{ question: firstQuestion, timestamp: new Date() }];
    session.transcript = [{ role: 'ai', content: firstQuestion, timestamp: new Date() }];

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
      provider: getActiveProvider(),
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

    console.log('ANSWER_RECEIVED');

    if (!candidateAnswer || !candidateAnswer.trim()) {
      return res.status(400).json({ success: false, message: 'candidateAnswer is required.' });
    }

    const session = await InterviewSession.findOne({ _id: sessionId, userId: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Interview session not found.' });
    }

    // Assign answer to the latest question in the session.questions array
    if (session.questions && session.questions.length > 0) {
      session.questions[session.questions.length - 1].answer = candidateAnswer.trim();
    } else {
      // Fallback if array is empty somehow
      session.questions = [{ question: '', answer: candidateAnswer.trim(), timestamp: new Date() }];
    }
    
    // Add to transcript
    session.transcript.push({ role: 'candidate', content: candidateAnswer.trim(), timestamp: new Date() });
    
    console.log('ANSWER_SAVED');

    // Count existing messages to assign sequence numbers
    const existingCount = await InterviewMessage.countDocuments({ sessionId });

    // Save candidate answer
    await InterviewMessage.create({
      sessionId,
      role: 'candidate',
      content: candidateAnswer.trim(),
      sequenceNumber: existingCount + 1,
    });

    // Generate AI follow-up via AI Provider
    let aiResponseObj;
    try {
      aiResponseObj = await generateNextResponse(session, conversationHistory, candidateAnswer.trim());
      console.log('QUESTION_GENERATED');
    } catch (aiErr) {
      console.error('AI error during sendMessage:', aiErr);
      return res.status(503).json({
        success: false,
        message: 'AI service temporarily unavailable. Please try again.',
      });
    }

    const combinedText = `${aiResponseObj.feedback} ${aiResponseObj.nextQuestion}`;

    // Update Session with AI's question and transcript
    session.questions.push({ question: aiResponseObj.nextQuestion, timestamp: new Date() });
    session.transcript.push({ role: 'ai', content: combinedText, timestamp: new Date() });
    await session.save();

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
      nextQuestion: aiResponseObj.nextQuestion,
      provider: getActiveProvider()
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
    
    // Check baseline before attempting atomic lock
    const initialSession = await InterviewSession.findOne({ _id: sessionId, userId: req.user._id });
    if (!initialSession) {
      return res.status(404).json({ success: false, message: 'Interview session not found.' });
    }
    if (initialSession.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Session is not completed yet.' });
    }
    if (initialSession.analysisCompleted || (initialSession.readiness && initialSession.readiness.overallScore > 0)) {
      return res.status(200).json({ success: true, session: initialSession });
    }

    // Atomic Lock Acquisition
    const session = await InterviewSession.findOneAndUpdate(
      { _id: sessionId, userId: req.user._id, analysisInProgress: false, analysisCompleted: false },
      { $set: { analysisInProgress: true } },
      { new: true }
    );

    if (!session) {
      // Either not found or already locked
      const checkSession = await InterviewSession.findOne({ _id: sessionId, userId: req.user._id });
      if (checkSession?.analysisCompleted) {
        return res.status(200).json({ success: true, session: checkSession });
      }
      if (checkSession?.analysisInProgress) {
        return res.status(409).json({ success: false, message: 'Analysis is already in progress.' });
      }
      return res.status(404).json({ success: false, message: 'Interview session not found or already processed.' });
    }

    console.log('INTERVIEW_COMPLETED');
    console.log('ANALYSIS_STARTED');

    let analysis;
    try {
      analysis = await generateInterviewAnalysis(session, session.transcript);
      console.log('ANALYSIS_COMPLETED');
    } catch (analysisErr) {
      const errorMsg = `Analysis unavailable.\nAI provider failed to evaluate this interview. Error: ${analysisErr.message}`;
      console.error(errorMsg);
      // Release lock on failure
      await InterviewSession.findByIdAndUpdate(session._id, { $set: { analysisInProgress: false } });
      return res.status(503).json({
        success: false,
        message: errorMsg,
        error: analysisErr.message
      });
    }
    
    // Calculate accurate readiness
    const overallScore = calculateReadiness(
      analysis.readiness.technicalAccuracy || 0,
      analysis.readiness.communication || 0,
      analysis.readiness.confidence || 0,
      analysis.readiness.completeness || 0
    );
    analysis.readiness.overallScore = overallScore;
    console.log('READINESS_CALCULATED');
    console.log('WEAKNESSES_EXTRACTED');
    
    // Atomically Update Session with Analysis and Release Lock
    const updatedSession = await InterviewSession.findOneAndUpdate(
      { _id: session._id },
      { 
        $set: { 
          readiness: analysis.readiness,
          feedback: analysis.feedback,
          analysisInProgress: false,
          analysisCompleted: true
        } 
      },
      { new: true }
    );
    
    console.log('ANALYSIS_SAVED');
    console.log('INTERVIEW_SAVED');

    // 3. Aggregate Stats to Profile (using findOneAndUpdate to prevent VersionErrors)
    let profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      profile = new Profile({
        user: req.user._id,
        stats: { interviewsCompleted: 0, currentStreak: 0, averageReadiness: 0 },
        weaknesses: [],
        learningPath: []
      });
      await profile.save();
    }
    
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

      await Profile.findOneAndUpdate(
        { user: req.user._id },
        { 
          $set: { 
            stats: profile.stats,
            weaknesses: profile.weaknesses,
            learningPath: profile.learningPath
          }
        }
      );
      console.log('DASHBOARD_UPDATED');
    }

    res.status(200).json({ success: true, session });
  } catch (err) {
    console.error('Error in analyzeInterview:', err);
    next(err);
  }
}
