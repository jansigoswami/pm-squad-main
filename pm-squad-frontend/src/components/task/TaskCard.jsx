import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTaskStore } from '../../store/taskStore';
import { useUiStore } from '../../store/uiStore';
import { formatDue } from '../../utils/dateUtils';
import { burstAt } from '../../utils/confetti';
import { cn } from '../../lib/utils';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';

// Due-chip colour → tailwind classes.
const DUE_COLORS = {
  green: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  gray: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

// Stagger-friendly variants for use inside an animated list.
export const taskCardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export default function TaskCard({
  task,
  showOwner = false,
  compact = false,
  onClick,
}) {
  const updateTask = useTaskStore((s) => s.updateTask);
  const openTaskSheet = useUiStore((s) => s.openTaskSheet);
  const checkRef = useRef(null);

  const handleClick = () => (onClick ? onClick(task) : openTaskSheet(task));

  const done = task.status === 'done';
  const due = formatDue(task.due);
  const isHigh = task.priority === 'high';
  const isBlocked = task.status === 'blocked';

  const toggleDone = async (e) => {
    e.stopPropagation();
    const nextStatus = done ? 'todo' : 'done';
    try {
      await updateTask(task._id, { status: nextStatus });
      if (nextStatus === 'done') burstAt(checkRef.current);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update task');
    }
  };

  return (
    <motion.div
      variants={taskCardVariants}
      whileHover={{ scale: 1.002 }}
      onClick={handleClick}
      className={cn(
        'group flex items-center gap-3 rounded-lg cursor-pointer bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 transition-all duration-150 hover:bg-gray-50 dark:hover:bg-gray-700/60',
        compact ? 'px-2.5 py-2' : 'px-3 py-2.5',
        done && 'opacity-50',
        isBlocked && 'border-l-4 border-l-red-500',
        !isBlocked && isHigh && 'border-l-4 border-l-orange-400'
      )}
    >
      {/* Checkbox */}
      <button
        ref={checkRef}
        onClick={toggleDone}
        className={cn(
          'shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors',
          done
            ? 'bg-green-500 border-green-500'
            : 'border-gray-300 dark:border-gray-500 hover:border-green-400'
        )}
        aria-label={done ? 'Mark as not done' : 'Mark as done'}
      >
        {done && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          >
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          </motion.span>
        )}
      </button>

      {/* Middle */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm text-gray-900 dark:text-gray-100',
            done && 'line-through text-gray-400 dark:text-gray-500'
          )}
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {task.title}
        </p>
        {task.labels?.length > 0 && !compact && (
          <div className="flex flex-wrap gap-1 mt-1">
            {task.labels.slice(0, 4).map((l) => (
              <span
                key={l}
                className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300"
              >
                {l}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right meta */}
      <div className="flex items-center gap-2 shrink-0">
        {due && (
          <span
            className={cn(
              'hidden sm:inline text-[10px] font-medium px-2 py-0.5 rounded-full',
              DUE_COLORS[due.color]
            )}
          >
            {due.label}
          </span>
        )}
        {isHigh && (
          <span
            className="h-2 w-2 rounded-full bg-red-500"
            title="High priority"
          />
        )}
        {!compact && (
          <Badge variant={task.type} size="sm" />
        )}
        {task.reminder && (
          <Bell className="h-3.5 w-3.5 text-gray-400" />
        )}
        {showOwner && task.owner && (
          <Avatar user={task.owner} size="sm" />
        )}
      </div>
    </motion.div>
  );
}
