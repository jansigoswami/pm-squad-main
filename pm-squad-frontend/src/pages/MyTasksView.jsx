import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Lock, Plus, ArrowUpDown } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import TaskCard, { taskCardVariants } from '../components/task/TaskCard';
import CompletedSection from '../components/task/CompletedSection';
import SkeletonList from '../components/ui/Skeleton';
import { cn } from '../lib/utils';

const STATUS_CHIPS = [
  { v: 'all', label: 'All' },
  { v: 'todo', label: 'Todo' },
  { v: 'inprog', label: 'In Progress' },
  { v: 'blocked', label: 'Blocked' },
  { v: 'done', label: 'Done' },
];
const TYPE_CHIPS = [
  { v: 'all', label: 'All' },
  { v: 'work', label: 'Work' },
  { v: 'personal', label: 'Personal' },
];
const PRIORITY_RANK = { high: 0, normal: 1, low: 2 };

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150',
        active
          ? 'bg-brand-600 text-white border-transparent'
          : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
      )}
    >
      {children}
    </button>
  );
}

function Section({ icon: Icon, label, tasks, emptyText }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-gray-500" />
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {label}
        </h2>
        <span className="text-xs text-gray-400">({tasks.length})</span>
      </div>
      {tasks.length === 0 ? (
        <p className="text-sm text-gray-400 px-1 py-3">{emptyText}</p>
      ) : (
        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {tasks.map((t) => (
            <motion.div key={t._id} variants={taskCardVariants}>
              <TaskCard task={t} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

export default function MyTasksView() {
  const tasks = useTaskStore((s) => s.tasks);
  const loading = useTaskStore((s) => s.loading);
  const getMyTasks = useTaskStore((s) => s.getMyTasks);
  const user = useAuthStore((s) => s.user);
  const openTaskSheet = useUiStore((s) => s.openTaskSheet);

  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [sort, setSort] = useState('due');

  const mine = getMyTasks(user?._id);

  const sortFn = useMemo(() => {
    if (sort === 'priority')
      return (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (sort === 'created')
      return (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
    // due (nulls last)
    return (a, b) => {
      if (!a.due) return 1;
      if (!b.due) return -1;
      return new Date(a.due) - new Date(b.due);
    };
  }, [sort]);

  const filtered = mine
    .filter((t) => (status === 'all' ? true : t.status === status))
    .filter((t) => (type === 'all' ? true : t.type === type))
    .sort(sortFn);

  const activeNotDone = filtered.filter((t) => t.status !== 'done');
  const work = activeNotDone.filter((t) => t.type === 'work');
  const personal = activeNotDone.filter((t) => t.type === 'personal');
  const done = mine.filter((t) => t.status === 'done');

  if (loading && tasks.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <SkeletonList count={6} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-8 space-y-6">
      {/* Filters */}
      <div className="space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_CHIPS.map((c) => (
            <Chip
              key={c.v}
              active={status === c.v}
              onClick={() => setStatus(c.v)}
            >
              {c.label}
            </Chip>
          ))}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {TYPE_CHIPS.map((c) => (
            <Chip key={c.v} active={type === c.v} onClick={() => setType(c.v)}>
              {c.label}
            </Chip>
          ))}
          <div className="ml-auto flex items-center gap-1 shrink-0">
            <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="text-xs bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-gray-600 dark:text-gray-300 focus:outline-none"
            >
              <option value="due">Due date</option>
              <option value="priority">Priority</option>
              <option value="created">Created</option>
            </select>
          </div>
        </div>
      </div>

      <Section
        icon={Briefcase}
        label="Work"
        tasks={work}
        emptyText="No work tasks. Add one!"
      />
      <Section
        icon={Lock}
        label="Personal"
        tasks={personal}
        emptyText="No personal tasks."
      />

      <CompletedSection tasks={done} />

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
