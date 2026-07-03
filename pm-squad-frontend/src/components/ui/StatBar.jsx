import { useEffect, useState } from 'react';
import { motion, useMotionValue, animate as fmAnimate } from 'framer-motion';

// Small count-up number using framer-motion.
function CountUp({ value }) {
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = fmAnimate(mv, value, {
      duration: 0.8,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return controls.stop;
  }, [value, mv]);

  return <span>{display}</span>;
}

/**
 * Three-card summary: Open / Done / Progress, for one user's tasks.
 */
export default function StatBar({ tasks = [], userId }) {
  const mine = userId
    ? tasks.filter((t) => t.owner?._id === userId || t.owner === userId)
    : tasks;

  const done = mine.filter((t) => t.status === 'done').length;
  const open = mine.filter((t) => t.status !== 'done').length;
  const total = done + open;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-xl bg-blue-50 dark:bg-blue-900/30 p-4">
        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
          <CountUp value={open} />
        </div>
        <div className="text-xs font-medium text-blue-600/80 dark:text-blue-400">
          Open
        </div>
      </div>

      <div className="rounded-xl bg-green-50 dark:bg-green-900/30 p-4">
        <div className="text-2xl font-bold text-green-700 dark:text-green-300">
          <CountUp value={done} />
        </div>
        <div className="text-xs font-medium text-green-600/80 dark:text-green-400">
          Done
        </div>
      </div>

      <div className="rounded-xl bg-purple-50 dark:bg-purple-900/30 p-4">
        <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
          <CountUp value={percent} />%
        </div>
        <div className="text-xs font-medium text-purple-600/80 dark:text-purple-400 mb-1.5">
          Progress
        </div>
        <div className="h-1.5 w-full rounded-full bg-purple-200 dark:bg-purple-800 overflow-hidden">
          <motion.div
            className="h-full bg-purple-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
}
