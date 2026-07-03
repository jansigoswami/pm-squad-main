import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import TaskCard from './TaskCard';
import { cn } from '../../lib/utils';

/**
 * Collapsible "Completed (N)" list with smooth height animation.
 */
export default function CompletedSection({ tasks = [], showOwner = false }) {
  const [open, setOpen] = useState(false);
  if (tasks.length === 0) return null;

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
      >
        <ChevronDown
          className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
        />
        Completed ({tasks.length})
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pt-3">
              {tasks.map((t) => (
                <TaskCard key={t._id} task={t} showOwner={showOwner} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
