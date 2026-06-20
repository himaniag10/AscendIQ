import * as interviewService from '../services/interview.service.js';
import { generateFirstQuestion } from '../services/gemini.service.js';
import InterviewSession from '../models/interviewSession.model.js';

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
    } catch (geminiErr) {
      console.error('Gemini error during interview start:', geminiErr);
      return res.status(503).json({
        success: false,
        message: 'Unable to start interview: Failed to generate question from AI service. Please check your Gemini API key or try again later.',
      });
    }

    session.status = 'scheduled';
    session.startedAt = new Date();
    session.firstQuestion = firstQuestion;
    await session.save();

    res.status(200).json({
      success: true,
      sessionId: session._id,
      firstQuestion,
    });
  } catch (err) {
    next(err);
  }
}
