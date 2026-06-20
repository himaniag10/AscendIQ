import InterviewSession from '../models/interviewSession.model.js';

/**
 * Create a new interview session for a user.
 */
export async function createSession(userId, payload) {
  const { mode, topic, difficulty, company, role, experienceLevel, round } = payload;

  const session = await InterviewSession.create({
    userId,
    mode,
    topic: topic || '',
    difficulty: difficulty || '',
    company: company || '',
    role: role || '',
    experienceLevel: experienceLevel || '',
    round: round || '',
    status: 'draft',
  });

  return session;
}

/**
 * Get all sessions for a user, newest first.
 */
export async function getSessionsByUser(userId) {
  return InterviewSession.find({ userId }).sort({ createdAt: -1 }).lean();
}

/**
 * Get a single session by ID, enforcing ownership.
 */
export async function getSessionById(sessionId, userId) {
  const session = await InterviewSession.findOne({ _id: sessionId, userId }).lean();
  if (!session) {
    const err = new Error('Interview session not found.');
    err.statusCode = 404;
    throw err;
  }
  return session;
}

/**
 * Update a session's status.
 */
export async function updateSessionStatus(sessionId, userId, status) {
  const validStatuses = ['draft', 'scheduled', 'completed', 'abandoned'];
  if (!validStatuses.includes(status)) {
    const err = new Error('Invalid status value.');
    err.statusCode = 400;
    throw err;
  }

  const updateData = { status };
  if (status === 'completed') updateData.completedAt = new Date();
  if (status === 'scheduled') updateData.startedAt = new Date();

  const session = await InterviewSession.findOneAndUpdate(
    { _id: sessionId, userId },
    updateData,
    { new: true }
  ).lean();

  if (!session) {
    const err = new Error('Interview session not found.');
    err.statusCode = 404;
    throw err;
  }

  return session;
}
