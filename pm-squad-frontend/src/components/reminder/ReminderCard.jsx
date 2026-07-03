import { useRef, useState } from 'react';
import { Bell, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import Toggle from '../ui/Toggle';
import { useClickOutside } from '../../hooks/useClickOutside';
import { cn } from '../../lib/utils';

const REPEAT_LABELS = {
  daily: 'Daily',
  weekdays: 'Weekdays',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  once: 'Once',
};

// "09:30" → "9:30 AM"
function pretty(time) {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function ReminderCard({ reminder, onToggle, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const menuRef = useRef(null);
  useClickOutside(menuRef, () => setMenuOpen(false), menuOpen);

  const detail = [
    pretty(reminder.time),
    REPEAT_LABELS[reminder.repeat] || reminder.repeat,
    reminder.forAll ? 'Everyone' : 'Myself',
  ].join('  •  ');

  return (
    <div
      className={cn(
        'group relative flex items-center gap-3 px-4 py-3 rounded-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-all duration-150',
        !reminder.isActive && 'opacity-60'
      )}
    >
      <Bell
        className={cn(
          'h-5 w-5 shrink-0',
          reminder.isActive ? 'text-brand-600' : 'text-gray-400'
        )}
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
          {reminder.title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{detail}</p>
      </div>

      <Toggle value={reminder.isActive} onChange={() => onToggle(reminder)} />

      {/* Menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 md:opacity-0 md:group-hover:opacity-100 transition"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-1 w-40 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg z-10 overflow-hidden">
            {!confirm ? (
              <>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(reminder);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Pencil className="h-4 w-4" /> Edit
                </button>
                <button
                  onClick={() => setConfirm(true)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </>
            ) : (
              <div className="p-2 text-xs">
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Delete this reminder?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setConfirm(false);
                      setMenuOpen(false);
                    }}
                    className="flex-1 py-1 rounded text-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(reminder);
                    }}
                    className="flex-1 py-1 rounded bg-red-500 text-white"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
