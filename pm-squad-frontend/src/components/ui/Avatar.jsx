import { cn } from '../../lib/utils';

const SIZES = {
  sm: { box: 'h-7 w-7', text: 'text-[10px]' },
  md: { box: 'h-9 w-9', text: 'text-xs' },
  lg: { box: 'h-12 w-12', text: 'text-sm' },
  xl: { box: 'h-16 w-16', text: 'text-lg' },
  xs: { box: 'h-5 w-5', text: 'text-[8px]' },
};

/**
 * Circular user avatar showing initials over the user's colour.
 */
export default function Avatar({ user, size = 'md', online = false, className }) {
  const s = SIZES[size] || SIZES.md;
  const initials = user?.initials || (user?.name ? user.name[0] : '?');
  const color = user?.color || '#6366F1';

  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-full font-semibold text-white select-none',
          s.box,
          s.text
        )}
        style={{ backgroundColor: color }}
        title={user?.name}
      >
        {initials}
      </span>
      {online && (
        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-900" />
      )}
    </span>
  );
}
