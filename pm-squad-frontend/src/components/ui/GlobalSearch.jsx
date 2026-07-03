import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { useTaskStore } from '../../store/taskStore';
import { useAuthStore } from '../../store/authStore';
import { canSeeTask } from '../../utils/permissionUtils';
import { formatDue } from '../../utils/dateUtils';
import Avatar from './Avatar';
import Badge from './Badge';
import { cn } from '../../lib/utils';

const RECENT_KEY = 'pm-squad-recent-search';

function loadRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
  } catch {
    return [];
  }
}

export default function GlobalSearch() {
  const open = useUiStore((s) => s.searchOpen);
  const openSearch = useUiStore((s) => s.openSearch);
  const closeSearch = useUiStore((s) => s.closeSearch);
  const openTaskSheet = useUiStore((s) => s.openTaskSheet);
  const tasks = useTaskStore((s) => s.tasks);
  const user = useAuthStore((s) => s.user);

  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState(loadRecent());
  const inputRef = useRef(null);

  // Global Ctrl/Cmd+K listener.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSearch();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openSearch]);

  // Focus + reset on open.
  useEffect(() => {
    if (open) {
      setQuery('');
      setDebounced('');
      setActive(0);
      setRecent(loadRecent());
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounce query (300ms).
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const results = useMemo(() => {
    if (!debounced.trim()) return [];
    const q = debounced.toLowerCase();
    return tasks
      .filter((t) => canSeeTask(t, user))
      .filter((t) => t.title.toLowerCase().includes(q))
      .slice(0, 10);
  }, [debounced, tasks, user]);

  const persistRecent = (q) => {
    const next = [q, ...recent.filter((r) => r !== q)].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    setRecent(next);
  };

  const select = (task) => {
    if (debounced.trim()) persistRecent(debounced.trim());
    closeSearch();
    openTaskSheet(task);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') return closeSearch();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && results[active]) {
      select(results[active]);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh] px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeSearch}
          />
          <motion.div
            initial={{ scale: 0.97, y: -8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.97, y: -8 }}
            className="relative w-full max-w-xl max-h-[600px] flex flex-col rounded-2xl bg-white dark:bg-gray-800 shadow-2xl overflow-hidden"
          >
            {/* Input */}
            <div className="flex items-center gap-2 px-4 h-14 border-b border-gray-200 dark:border-gray-700">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Search tasks..."
                className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white"
              />
              <button onClick={closeSearch} className="text-gray-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto">
              {debounced.trim() ? (
                results.length > 0 ? (
                  results.map((t, i) => {
                    const due = formatDue(t.due);
                    return (
                      <button
                        key={t._id}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => select(t)}
                        className={cn(
                          'flex items-center gap-2 w-full px-4 py-2.5 text-left border-l-2',
                          i === active
                            ? 'border-brand-600 bg-brand-50 dark:bg-brand-600/10'
                            : 'border-transparent'
                        )}
                      >
                        {t.status === 'blocked' && (
                          <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                        )}
                        <span className="flex-1 text-sm text-gray-800 dark:text-gray-100 truncate">
                          {t.title}
                        </span>
                        <Badge variant={t.type} size="sm" />
                        {due && (
                          <span className="text-[11px] text-gray-400">
                            {due.label}
                          </span>
                        )}
                        {t.owner && <Avatar user={t.owner} size="sm" />}
                      </button>
                    );
                  })
                ) : (
                  <p className="px-4 py-8 text-center text-sm text-gray-400">
                    No tasks found for &quot;{debounced}&quot;
                  </p>
                )
              ) : recent.length > 0 ? (
                <div className="py-2">
                  <div className="flex items-center justify-between px-4 py-1">
                    <span className="text-xs font-medium text-gray-400">
                      Recent searches
                    </span>
                    <button
                      onClick={() => {
                        localStorage.removeItem(RECENT_KEY);
                        setRecent([]);
                      }}
                      className="text-xs text-gray-400 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                  {recent.map((r) => (
                    <button
                      key={r}
                      onClick={() => setQuery(r)}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Search className="h-3.5 w-3.5 text-gray-400" /> {r}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="px-4 py-8 text-center text-sm text-gray-400">
                  Type to search your tasks
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
