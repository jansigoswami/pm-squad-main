import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  format,
} from 'date-fns';
import { ChevronLeft, ChevronRight, X, Plus } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { useUiStore } from '../store/uiStore';
import TaskCard from '../components/task/TaskCard';
import { cn } from '../lib/utils';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function pillColor(task) {
  if (task.status === 'blocked') return 'bg-red-500';
  if (task.priority === 'high') return 'bg-orange-400';
  return 'bg-blue-500';
}

export default function CalendarView() {
  const tasks = useTaskStore((s) => s.tasks);
  const openTaskSheet = useUiStore((s) => s.openTaskSheet);

  const [current, setCurrent] = useState(new Date());
  const [selected, setSelected] = useState(null);

  // Build the 6-week grid of days.
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(current));
    const end = endOfWeek(endOfMonth(current));
    const arr = [];
    let d = start;
    while (d <= end) {
      arr.push(d);
      d = addDays(d, 1);
    }
    return arr;
  }, [current]);

  // Map yyyy-mm-dd → tasks due that day.
  const byDay = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      if (!t.due) return;
      const key = format(new Date(t.due), 'yyyy-MM-dd');
      (map[key] = map[key] || []).push(t);
    });
    return map;
  }, [tasks]);

  const tasksFor = (date) => byDay[format(date, 'yyyy-MM-dd')] || [];
  const today = new Date();

  return (
    <div className="max-w-5xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {format(current, 'MMMM yyyy')}
        </h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrent((c) => subMonths(c, 1))}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCurrent(new Date())}
            className="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Today
          </button>
          <button
            onClick={() => setCurrent((c) => addMonths(c, 1))}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* DOW row */}
      <div className="grid grid-cols-7 mb-1">
        {DOW.map((d) => (
          <div
            key={d}
            className="text-center text-[11px] font-medium text-gray-400 py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
        {days.map((date) => {
          const inMonth = isSameMonth(date, current);
          const isToday = isSameDay(date, today);
          const dayTasks = tasksFor(date);
          return (
            <button
              key={date.toISOString()}
              onClick={() => setSelected(date)}
              className={cn(
                'min-h-[60px] sm:min-h-[80px] p-1 text-left align-top transition-colors',
                inMonth
                  ? 'bg-white dark:bg-gray-800'
                  : 'bg-gray-50 dark:bg-gray-900/50',
                'hover:bg-brand-50 dark:hover:bg-gray-700/60'
              )}
            >
              <div className="flex justify-end">
                <span
                  className={cn(
                    'text-[11px] h-5 w-5 flex items-center justify-center rounded-full',
                    isToday
                      ? 'bg-brand-600 text-white'
                      : inMonth
                      ? 'text-gray-600 dark:text-gray-300'
                      : 'text-gray-300 dark:text-gray-600'
                  )}
                >
                  {format(date, 'd')}
                </span>
              </div>
              <div className="mt-0.5 space-y-0.5">
                {dayTasks.slice(0, 3).map((t) => (
                  <div
                    key={t._id}
                    className="flex items-center gap-1 text-[10px] text-gray-600 dark:text-gray-300"
                  >
                    <span
                      className={cn('h-1.5 w-1.5 rounded-full shrink-0', pillColor(t))}
                    />
                    <span className="truncate hidden sm:block">
                      {t.title.slice(0, 12)}
                    </span>
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-[10px] text-gray-400">
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Side panel */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50">
            <motion.div
              className="absolute inset-0 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
            />
            <motion.div
              className="absolute right-0 top-0 bottom-0 w-full sm:w-80 bg-white dark:bg-gray-900 shadow-xl flex flex-col"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Tasks for {format(selected, 'MMMM d')}
                </h2>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {tasksFor(selected).length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">
                    No tasks due this day.
                  </p>
                ) : (
                  tasksFor(selected).map((t) => (
                    <TaskCard key={t._id} task={t} compact showOwner />
                  ))
                )}
              </div>

              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    openTaskSheet(null, { due: selected });
                    setSelected(null);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-brand-700 hover:bg-brand-600 text-white text-sm font-medium"
                >
                  <Plus className="h-4 w-4" /> Add task
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
