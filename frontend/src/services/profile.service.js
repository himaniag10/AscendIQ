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
};
