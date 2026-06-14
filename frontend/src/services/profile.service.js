import { api } from './api.js';

const PROFILE_PATH = '/profile';

export const profileService = {
  async getMyProfile() {
    const response = await api.get(`${PROFILE_PATH}/me`);
    return response.data;
  },

  async updateMyProfile(profile) {
    const response = await api.put(`${PROFILE_PATH}/me`, profile);
    return response.data;
  },

  async uploadAvatar(file) {
    const fd = new FormData();
    fd.append('avatar', file);
    const response = await api.post(`${PROFILE_PATH}/upload-avatar`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async uploadResume(file) {
    const fd = new FormData();
    fd.append('resume', file);
    const response = await api.post(`${PROFILE_PATH}/upload-resume`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async deleteAvatar() {
    const response = await api.delete(`${PROFILE_PATH}/avatar`);
    return response.data;
  },

  async deleteResume() {
    const response = await api.delete(`${PROFILE_PATH}/resume`);
    return response.data;
  },
};
