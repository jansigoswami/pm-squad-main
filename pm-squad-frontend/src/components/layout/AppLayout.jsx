import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useTaskStore } from '../../store/taskStore';
import { useSocket } from '../../hooks/useSocket';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import TaskSheet from '../task/TaskSheet';
import ReminderSheet from '../reminder/ReminderSheet';
import GlobalSearch from '../ui/GlobalSearch';

export default function AppLayout() {
  const location = useLocation();
  const fetchTasks = useTaskStore((s) => s.fetchTasks);

  useSocket();

  // Load tasks; if the API is unreachable, retry every 30s.
  useEffect(() => {
    let retry;
    const load = () =>
      fetchTasks().catch(() => {
        toast.error('Connection lost. Retrying…', { id: 'conn' });
        retry = setTimeout(load, 30000);
      });
    load();
    return () => clearTimeout(retry);
  }, [fetchTasks]);

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-app)] text-[var(--text-primary)]">
      <Topbar />

      <div className="flex flex-1 min-h-0">
        <Sidebar />

        <main className="flex-1 min-w-0 p-4 pb-20 md:pb-4 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <BottomNav />

      {/* Global overlays */}
      <TaskSheet />
      <ReminderSheet />
      <GlobalSearch />
    </div>
  );
}
