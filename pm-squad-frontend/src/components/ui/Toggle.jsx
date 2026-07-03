import { cn } from '../../lib/utils';

/**
 * iOS-style switch.
 */
export default function Toggle({ value, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      disabled={disabled}
      onClick={() => !disabled && onChange?.(!value)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-1',
        value ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200',
          value ? 'translate-x-5' : 'translate-x-0.5'
        )}
      />
    </button>
  );
}
