import { format, formatDistanceToNow } from 'date-fns';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Short "x ago" label for a timestamp. */
export function timeAgo(dateString) {
  if (!dateString) return '';
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return '';
  }
}

// Midnight (local) for a given date.
const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

/**
 * Human-friendly due-date label + colour bucket.
 * Returns null when there is no date.
 */
export function formatDue(dateString) {
  if (!dateString) return null;

  const today = startOfDay(new Date());
  const due = startOfDay(new Date(dateString));
  const diff = Math.round((due.getTime() - today.getTime()) / MS_PER_DAY);

  if (diff === 0) return { label: 'Today', color: 'green', isOverdue: false };
  if (diff === 1)
    return { label: 'Tomorrow', color: 'amber', isOverdue: false };
  if (diff < 0)
    return {
      label: `${Math.abs(diff)}d overdue`,
      color: 'red',
      isOverdue: true,
    };
  if (diff <= 7)
    return { label: `${diff}d left`, color: 'blue', isOverdue: false };

  return {
    label: format(new Date(dateString), 'MMM d'),
    color: 'gray',
    isOverdue: false,
  };
}

const HEADER_COLORS = [
  '#5c2d4e',
  '#1e4d3a',
  '#1e3a5c',
  '#4a3020',
  '#3a1e4d',
  '#1e4040',
  '#4d3a1e',
  '#1e3a3a',
];

/**
 * Deterministic dark colour for a date-group header, derived from the string.
 */
export function dateHeaderColor(dateString) {
  const str = dateString || '__nodate__';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xffff;
  }
  return HEADER_COLORS[hash % 8];
}

// Local YYYY-MM-DD key for a date.
const dateKey = (d) => {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * Group tasks by due-date key (YYYY-MM-DD); undated tasks under '__nodate__'.
 * Dated keys are sorted chronologically, with '__nodate__' appended last.
 * Returns a Map preserving that order.
 */
export function groupByDate(tasks) {
  const buckets = {};
  for (const task of tasks) {
    const key = task.due ? dateKey(task.due) : '__nodate__';
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(task);
  }

  const dated = Object.keys(buckets)
    .filter((k) => k !== '__nodate__')
    .sort();

  const ordered = new Map();
  dated.forEach((k) => ordered.set(k, buckets[k]));
  if (buckets['__nodate__']) ordered.set('__nodate__', buckets['__nodate__']);

  return ordered;
}
