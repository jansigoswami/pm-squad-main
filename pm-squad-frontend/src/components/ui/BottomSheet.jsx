import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Slide-up modal sheet with spring physics and a drag handle.
 */
export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  maxHeight = '92vh',
  className,
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black"
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 0.5 } }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className={cn(
              'relative w-full sm:max-w-2xl bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl flex flex-col',
              className
            )}
            style={{ maxHeight }}
            variants={{ hidden: { y: '100%' }, visible: { y: 0 } }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120) onClose?.();
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <span className="h-1.5 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>

            {/* Title row */}
            <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-150"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto px-5 py-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
