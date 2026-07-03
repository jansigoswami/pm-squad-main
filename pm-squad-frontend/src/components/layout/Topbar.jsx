import { useRef, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Search, Bell, LogOut, Mail, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { titleForPath } from '../../utils/navConfig';
import { timeAgo } from '../../utils/dateUtils';
import Avatar from '../ui/Avatar';
import DarkModeToggle from '../ui/DarkModeToggle';
import { useClickOutside } from '../../hooks/useClickOutside';

export default function Topbar() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const notifications = useUiStore((s) => s.notifications);
  const markAllRead = useUiStore((s) => s.markAllRead);
  const clearNotifications = useUiStore((s) => s.clearNotifications);
  const openSearch = useUiStore((s) => s.openSearch);
  const openSidebar = useUiStore((s) => s.openSidebar);

  const [bellOpen, setBellOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ring, setRing] = useState(false);

  const bellRef = useRef(null);
  const menuRef = useRef(null);
  useClickOutside(bellRef, () => setBellOpen(false), bellOpen);
  useClickOutside(menuRef, () => setMenuOpen(false), menuOpen);

  const unread = notifications.filter((n) => !n.read).length;

  // Ring the bell briefly whenever a new notification arrives.
  useEffect(() => {
    if (notifications.length === 0) return;
    setRing(true);
    const t = setTimeout(() => setRing(false), 800);
    return () => clearTimeout(t);
  }, [notifications.length]);

  const iconBtn =
    'p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-600';

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-3 sm:px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      {/* Left */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          className={`${iconBtn} md:hidden`}
          onClick={openSidebar}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-bold text-lg text-brand-700 dark:text-brand-500">
          PM Squad
        </span>
        <span className="hidden sm:inline text-sm text-gray-400 dark:text-gray-500 truncate">
          / {titleForPath(location.pathname)}
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1 sm:gap-2">
        <button onClick={openSearch} className={iconBtn} aria-label="Search">
          <Search className="h-5 w-5" />
        </button>

        <DarkModeToggle />

        {/* Notification bell */}
        <div className="relative" ref={bellRef}>
          <motion.button
            className={iconBtn}
            onClick={() => setBellOpen((v) => !v)}
            animate={ring ? { rotate: [0, -15, 15, -15, 15, 0] } : {}}
            transition={{ duration: 0.6 }}
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-semibold">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </motion.button>

          <AnimatePresence>
            {bellOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute right-0 mt-2 w-[300px] max-h-[400px] overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg"
              >
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    Notifications
                  </span>
                  <div className="flex gap-2 text-xs">
                    <button
                      onClick={markAllRead}
                      className="text-brand-600 hover:underline"
                    >
                      Mark all read
                    </button>
                    <button
                      onClick={clearNotifications}
                      className="text-gray-500 hover:underline"
                    >
                      Clear all
                    </button>
                  </div>
                </div>

                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-400">
                    No notifications yet
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      className={`flex gap-2 px-3 py-2.5 border-b border-gray-100 dark:border-gray-700/50 ${
                        n.read ? 'opacity-60' : ''
                      }`}
                    >
                      <span className="mt-0.5 text-brand-600">
                        {n.type === 'mention' ? (
                          <MessageSquare className="h-4 w-4" />
                        ) : (
                          <Bell className="h-4 w-4" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm text-gray-800 dark:text-gray-200 break-words">
                          {n.message}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {timeAgo(n.id)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar + menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-full focus:outline-none focus:ring-2 focus:ring-brand-600"
          >
            <Avatar user={user} size="md" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden"
              >
                <div className="flex items-center gap-3 px-3 py-3 border-b border-gray-200 dark:border-gray-700">
                  <Avatar user={user} size="lg" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {user?.name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user?.role}
                    </p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-150"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
