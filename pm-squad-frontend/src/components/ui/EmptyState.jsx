import { motion } from 'framer-motion';

/**
 * Friendly empty-state block with a gently floating icon and optional CTA.
 */
export default function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && (
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-4 text-gray-300 dark:text-gray-600"
        >
          <Icon className="h-12 w-12" />
        </motion.div>
      )}
      <p className="text-base font-medium text-gray-700 dark:text-gray-200">
        {title}
      </p>
      {subtitle && (
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500 max-w-xs">
          {subtitle}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
