import { create } from 'zustand';
import api from '../api/axios';

export const useReminderStore = create((set) => ({
  reminders: [],
  loading: false,

  fetchReminders: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/reminders');
      set({ reminders: data.data || [], loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  createReminder: async (payload) => {
    const { data } = await api.post('/reminders', payload);
    set((s) => ({ reminders: [data.data, ...s.reminders] }));
    return data.data;
  },

  updateReminder: async (id, payload) => {
    const { data } = await api.patch(`/reminders/${id}`, payload);
    set((s) => ({
      reminders: s.reminders.map((r) => (r._id === id ? data.data : r)),
    }));
    return data.data;
  },

  deleteReminder: async (id) => {
    await api.delete(`/reminders/${id}`);
    set((s) => ({ reminders: s.reminders.filter((r) => r._id !== id) }));
  },
}));
