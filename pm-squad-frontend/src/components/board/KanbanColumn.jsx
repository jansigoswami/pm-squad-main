import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { canEdit } from '../../utils/permissionUtils';
import TaskCard from '../task/TaskCard';
import MiniStatusSheet from './MiniStatusSheet';
import Avatar from '../ui/Avatar';
import { cn } from '../../lib/utils';

const PRIORITY_RANK = { high: 0, normal: 1, low: 2 };

/**
 * One person's swimlane column on the team board.
 */
export default function KanbanColumn({
  columnUser,
  currentUser,
  allTasks,
  index = 0,
  canEditAll = false,
}) {
  const openTaskSheet = useUiStore((s) => s.openTaskSheet);
  const [miniTask, setMiniTask] = useState(null);

  const isSelf = currentUser?._id === columnUser._id;

  // Work tasks owned by this user + own personal tasks (only when viewing self).
  const columnTasks = allTasks
    .filter((t) => {
      const ownerId = t.owner?._id || t.owner;
      if (ownerId !== columnUser._id) return false;
      if (t.type === 'work') return true;
      if (t.type === 'personal') return isSelf;
      return false;
    })
    .sort((a, b) => {
      if (a.status === 'blocked' && b.status !== 'blocked') return -1;
      if (b.status === 'blocked' && a.status !== 'blocked') return 1;
      const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (p !== 0) return p;
      if (!a.due) return 1;
      if (!b.due) return -1;
      return new Date(a.due) - new Date(b.due);
    });

  const done = columnTasks.filter((t) => t.status === 'done').length;
  const open = columnTasks.filter((t) => t.status !== 'done').length;
  const blocked = columnTasks.filter((t) => t.status === 'blocked').length;
  const total = done + open;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  const onCardClick = (task) => {
    if (canEditAll || canEdit(task, currentUser)) {
      openTaskSheet(task);
    } else {
      setMiniTask(task);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="flex-none w-[280px] sm:w-[300px] rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 flex flex-col"
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Avatar user={columnUser} size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {columnUser.name}
            </p>
            <span className="text-[10px] uppercase tracking-wide text-gray-400">
              {columnUser.role}
            </span>
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            {open} open
          </span>
        </div>

        {/* Progress */}
        <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <motion.div
            className="h-full bg-brand-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>

        {blocked > 0 && (
          <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
            <AlertTriangle className="h-3 w-3" /> {blocked} Blocked
          </div>
        )}
      </div>

      {/* Tasks */}
      <div className="p-2 space-y-2 overflow-y-auto" style={{ maxHeight: '60vh' }}>
        {columnTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-300 dark:text-gray-600">
            <CheckCircle2 className="h-8 w-8 mb-2" />
            <span className="text-xs">All clear!</span>
          </div>
        ) : (
          columnTasks.map((task) => (
            <div
              key={task._id}
              className={cn(
                'rounded-lg border-l-4',
                task.type === 'work'
                  ? 'border-l-blue-500'
                  : 'border-l-purple-500'
              )}
            >
              <TaskCard task={task} onClick={onCardClick} />
            </div>
          ))
        )}
      </div>

      {miniTask && (
        <MiniStatusSheet task={miniTask} onClose={() => setMiniTask(null)} />
      )}
    </motion.div>
  );
}
