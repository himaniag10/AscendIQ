import { api } from './api.js';

export const goalService = {
  getGoals: async () => {
    const { data } = await api.get('/goals');
    return data;
  },

  createGoal: async (payload) => {
    const { data } = await api.post('/goals', payload);
    return data;
  },

  deleteGoal: async (id) => {
    const { data } = await api.delete(`/goals/${id}`);
    return data;
  },
};
