import { create } from 'zustand';
import api from '../api/axios';

export const useTaskStore = create((set, get) => ({
  tasks: [],
  loading: false,
  filters: { status: 'all', priority: 'all', type: 'all', sort: 'due' },

  fetchTasks: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/tasks');
      set({ tasks: data.data || [], loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  createTask: async (payload) => {
    const { data } = await api.post('/tasks', payload);
    set((state) => ({ tasks: [...state.tasks, data.data] }));
    return data.data;
  },

  updateTask: async (id, payload) => {
    const { data } = await api.patch(`/tasks/${id}`, payload);
    set((state) => ({
      tasks: state.tasks.map((t) => (t._id === id ? data.data : t)),
    }));
    return data.data;
  },

  deleteTask: async (id) => {
    await api.delete(`/tasks/${id}`);
    set((state) => ({ tasks: state.tasks.filter((t) => t._id !== id) }));
  },

  // --- Local mutations driven by socket events ---
  addTaskLocal: (task) =>
    set((state) => {
      if (state.tasks.some((t) => t._id === task._id)) return state;
      return { tasks: [task, ...state.tasks] };
    }),

  updateTaskLocal: (task) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t._id === task._id ? task : t)),
    })),

  removeTaskLocal: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t._id !== taskId),
    })),

  // --- Filters & selectors ---
  setFilter: (key, val) =>
    set((state) => ({ filters: { ...state.filters, [key]: val } })),

  getMyTasks: (userId) =>
    get().tasks.filter(
      (t) => t.owner?._id === userId || t.owner === userId
    ),

  getWorkTasks: () => get().tasks.filter((t) => t.type === 'work'),
}));
