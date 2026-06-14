import { api } from './api.js';

const AUTH_PATH = '/auth';

export const authService = {
  setToken(token) {
    this.token = token;
  },
  clearToken() {
    this.token = null;
  },
  async login(credentials) {
    const response = await api.post(`${AUTH_PATH}/login`, credentials);
    return response.data;
  },
  async register(details) {
    const response = await api.post(`${AUTH_PATH}/register`, details);
    return response.data;
  },
  async googleLogin(idToken) {
    const response = await api.post(`${AUTH_PATH}/google-login`, { idToken });
    return response.data;
  },
  async verifyOTP(email, otp) {
    const response = await api.post(`${AUTH_PATH}/verify-otp`, { email, otp });
    return response.data;
  },
  async resendOTP(email) {
    const response = await api.post(`${AUTH_PATH}/resend-otp`, { email });
    return response.data;
  },
  async getCurrentUser() {
    const response = await api.get(`${AUTH_PATH}/me`);
    return response.data;
  },
  async forgotPassword(email) {
    const response = await api.post(`${AUTH_PATH}/forgot-password`, { email });
    return response.data;
  },
  async resetPassword(email, otp, password) {
    const response = await api.post(`${AUTH_PATH}/reset-password`, { email, otp, password });
    return response.data;
  },
};


