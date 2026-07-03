import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';

/**
 * Button that toggles dark mode, with a rotating sun/moon swap.
 */
export default function DarkModeToggle() {
  const darkMode = useUiStore((s) => s.darkMode);
  const toggleDark = useUiStore((s) => s.toggleDark);

  return (
    <motion.button
      type="button"
      onClick={toggleDark}
      whileTap={{ scale: 0.9 }}
      title="Toggle theme"
      className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-600"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={darkMode ? 'moon' : 'sun'}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="block"
        >
          {darkMode ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
