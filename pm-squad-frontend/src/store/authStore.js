import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const AUTH_KEY = 'pm-squad-auth';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) =>
        set({ user, token, isAuthenticated: true }),

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem(AUTH_KEY);
        window.location.href = '/login';
      },

      isBoss: () => get().user?.role === 'boss',

      isOwner: (task) => {
        const userId = get().user?._id;
        if (!userId || !task) return false;
        return (
          task?.owner?._id === userId || task?.owner === userId
        );
      },
    }),
    {
      name: AUTH_KEY,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
