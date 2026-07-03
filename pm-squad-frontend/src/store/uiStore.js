import { create } from 'zustand';

const THEME_KEY = 'pm-squad-theme';

export const useUiStore = create((set) => ({
  darkMode: false,
  notifications: [],
  taskSheetOpen: false,
  taskSheetData: null, // null = create mode, task object = edit mode
  taskSheetDefaults: null, // optional prefill (e.g. due date) for create mode
  reminderSheetOpen: false,
  reminderSheetData: null,
  searchOpen: false,
  sidebarOpen: false, // mobile drawer

  toggleDark: () =>
    set((state) => {
      const next = !state.darkMode;
      const root = document.documentElement;
      if (next) {
        root.classList.add('dark');
        localStorage.setItem(THEME_KEY, 'dark');
      } else {
        root.classList.remove('dark');
        localStorage.setItem(THEME_KEY, 'light');
      }
      return { darkMode: next };
    }),

  initDark: () => {
    const saved = localStorage.getItem(THEME_KEY);
    const isDark = saved === 'dark';
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    set({ darkMode: isDark });
  },

  openTaskSheet: (task = null, defaults = null) =>
    set({ taskSheetOpen: true, taskSheetData: task, taskSheetDefaults: defaults }),
  closeTaskSheet: () =>
    set({ taskSheetOpen: false, taskSheetData: null, taskSheetDefaults: null }),

  openReminderSheet: (reminder = null) =>
    set({ reminderSheetOpen: true, reminderSheetData: reminder }),
  closeReminderSheet: () =>
    set({ reminderSheetOpen: false, reminderSheetData: null }),

  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false }),

  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),

  addNotification: (n) =>
    set((state) => ({
      notifications: [
        { ...n, id: Date.now(), read: false },
        ...state.notifications,
      ].slice(0, 20),
    })),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  clearNotifications: () => set({ notifications: [] }),
}));
