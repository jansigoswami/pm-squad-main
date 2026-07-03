import { motion } from 'framer-motion';
import { Plus, PartyPopper } from 'lucide-react';
import { format } from 'date-fns';
import { useTaskStore } from '../store/taskStore';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { groupByDate, dateHeaderColor } from '../utils/dateUtils';
import StatBar from '../components/ui/StatBar';
import TaskCard, { taskCardVariants } from '../components/task/TaskCard';
import CompletedSection from '../components/task/CompletedSection';
import EmptyState from '../components/ui/EmptyState';
import SkeletonList from '../components/ui/Skeleton';

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

function groupLabel(key) {
  if (key === '__nodate__') return 'No Due Date';
  // key is YYYY-MM-DD (local) — parse as local date.
  const [y, m, d] = key.split('-').map(Number);
  return format(new Date(y, m - 1, d), 'd MMMM, EEEE');
}

export default function TodayView() {
  const tasks = useTaskStore((s) => s.tasks);
  const loading = useTaskStore((s) => s.loading);
  const getMyTasks = useTaskStore((s) => s.getMyTasks);
  const user = useAuthStore((s) => s.user);
  const openTaskSheet = useUiStore((s) => s.openTaskSheet);

  const mine = getMyTasks(user?._id);
  const incomplete = mine.filter((t) => t.status !== 'done');
  const done = mine.filter((t) => t.status === 'done');
  const groups = groupByDate(incomplete);

  if (loading && tasks.length === 0) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <SkeletonList count={5} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-8">
      <StatBar tasks={mine} userId={user?._id} />

      {mine.length === 0 ? (
        <EmptyState
          icon={PartyPopper}
          title="All clear for today! 🎉"
          subtitle="You have no tasks. Create one to get started."
          action={
            <button
              onClick={() => openTaskSheet()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-700 hover:bg-brand-600 text-white text-sm font-medium"
            >
              <Plus className="h-4 w-4" /> New Task
            </button>
          }
        />
      ) : (
        <div className="mt-6 space-y-6">
          {[...groups.entries()].map(([key, groupTasks]) => (
            <div key={key}>
              {/* Group header */}
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 mb-2"
                style={{ backgroundColor: dateHeaderColor(key) }}
              >
                <span className="text-sm font-semibold text-white">
                  {groupLabel(key)}
                </span>
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-white/90 text-gray-700">
                  {groupTasks.length}
                </span>
              </div>

              {/* Tasks */}
              <motion.div
                variants={listVariants}
                initial="hidden"
                animate="visible"
                className="space-y-2"
              >
                {groupTasks.map((t) => (
                  <motion.div key={t._id} variants={taskCardVariants}>
                    <TaskCard task={t} />
                  </motion.div>
                ))}
              </motion.div>

              {/* Add task row */}
              <button
                onClick={() =>
                  openTaskSheet(
                    null,
                    key !== '__nodate__'
                      ? { due: new Date(key + 'T00:00:00') }
                      : null
                  )
                }
                className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-400 hover:text-brand-600 hover:border-brand-400 transition-all duration-150"
              >
                <Plus className="h-4 w-4" /> Add task
              </button>
            </div>
          ))}

          <CompletedSection tasks={done} />
        </div>
      )}

      {/* Floating action button (mobile) */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => openTaskSheet()}
        className="md:hidden fixed bottom-20 right-5 z-20 h-14 w-14 rounded-full bg-brand-700 text-white shadow-lg flex items-center justify-center"
        aria-label="New task"
      >
        <Plus className="h-6 w-6" />
      </motion.button>
    </div>
  );
}
