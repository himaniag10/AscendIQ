import { api } from './api.js';

const BASE = '/interview';

export const interviewService = {
  /**
   * Create a new interview session (Learning or Placement).
   */
  async createSession(payload) {
    const response = await api.post(`${BASE}/session`, payload);
    return response.data;
  },

  /**
   * Fetch all sessions for the current user.
   */
  async getMySessions() {
    const response = await api.get(`${BASE}/sessions`);
    return response.data;
  },

  /**
   * Fetch a single session by ID.
   */
  async getSession(id) {
    const response = await api.get(`${BASE}/session/${id}`);
    return response.data;
  },

  /**
   * Update the status of a session.
   */
  async updateSessionStatus(id, status) {
    const response = await api.patch(`${BASE}/session/${id}/status`, { status });
    return response.data;
  },

  /**
   * Start a mock interview — generates first Gemini question.
   */
  async startInterview(payload) {
    const response = await api.post(`${BASE}/start`, payload);
    return response.data;
  },

  /**
   * Send a candidate answer and get the next AI interviewer response.
   * @param {string} sessionId
   * @param {string} candidateAnswer
   * @param {Array}  conversationHistory - Array of {role, content} objects
   */
  async sendMessage(sessionId, candidateAnswer, conversationHistory = []) {
    const response = await api.post(`${BASE}/${sessionId}/message`, {
      candidateAnswer,
      conversationHistory,
    });
    return response.data;
  },

  /**
   * Fetch full conversation history for a session.
   */
  async getMessages(sessionId) {
    const response = await api.get(`${BASE}/${sessionId}/messages`);
    return response.data;
  },

  /**
   * Analyze completed interview (readiness and weaknesses).
   */
  async analyzeInterview(sessionId) {
    const response = await api.post(`${BASE}/${sessionId}/analyze`);
    return response.data;
  },
};
