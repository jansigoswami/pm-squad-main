import { cn } from '../../lib/utils';

// Variant → tailwind classes (colours hold in both light and dark modes).
const VARIANTS = {
  // status
  todo: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  inprog: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  blocked: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  done: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  // type
  work: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  personal:
    'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  // priority
  high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  normal:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

// Human labels for known enum variants.
const LABELS = {
  todo: 'To Do',
  inprog: 'In Progress',
  blocked: 'Blocked',
  done: 'Done',
  work: 'Work',
  personal: 'Personal',
  high: 'High',
  normal: 'Normal',
  low: 'Low',
};

export default function Badge({ variant = 'todo', label, size = 'md', className }) {
  const sizeCls =
    size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium whitespace-nowrap',
        VARIANTS[variant] || VARIANTS.todo,
        sizeCls,
        className
      )}
    >
      {label || LABELS[variant] || variant}
    </span>
  );
}
