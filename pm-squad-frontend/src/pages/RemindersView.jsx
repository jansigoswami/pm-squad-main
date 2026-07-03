import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { BellPlus, Bell } from 'lucide-react';
import { useReminderStore } from '../store/reminderStore';
import { useUiStore } from '../store/uiStore';
import ReminderCard from '../components/reminder/ReminderCard';
import EmptyState from '../components/ui/EmptyState';

export default function RemindersView() {
  const reminders = useReminderStore((s) => s.reminders);
  const loading = useReminderStore((s) => s.loading);
  const fetchReminders = useReminderStore((s) => s.fetchReminders);
  const updateReminder = useReminderStore((s) => s.updateReminder);
  const deleteReminder = useReminderStore((s) => s.deleteReminder);
  const openReminderSheet = useUiStore((s) => s.openReminderSheet);

  useEffect(() => {
    fetchReminders().catch(() => {});
  }, [fetchReminders]);

  const onToggle = async (r) => {
    try {
      await updateReminder(r._id, { isActive: !r.isActive });
    } catch {
      toast.error('Could not update reminder');
    }
  };

  const onDelete = async (r) => {
    try {
      await deleteReminder(r._id);
      toast.success('Reminder deleted');
    } catch {
      toast.error('Could not delete reminder');
    }
  };

  const active = reminders.filter((r) => r.isActive);
  const inactive = reminders.filter((r) => !r.isActive);

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Reminders
        </h1>
        <button
          onClick={() => openReminderSheet()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-700 hover:bg-brand-600 text-white text-sm font-medium"
        >
          <BellPlus className="h-4 w-4" /> New Reminder
        </button>
      </div>

      {!loading && reminders.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No reminders yet"
          subtitle="Create your first reminder to stay on track."
          action={
            <button
              onClick={() => openReminderSheet()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-700 hover:bg-brand-600 text-white text-sm font-medium"
            >
              <BellPlus className="h-4 w-4" /> New Reminder
            </button>
          }
        />
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                Active
              </h2>
              <div className="space-y-2">
                {active.map((r) => (
                  <ReminderCard
                    key={r._id}
                    reminder={r}
                    onToggle={onToggle}
                    onEdit={openReminderSheet}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </section>
          )}

          {inactive.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                Inactive
              </h2>
              <div className="space-y-2">
                {inactive.map((r) => (
                  <ReminderCard
                    key={r._id}
                    reminder={r}
                    onToggle={onToggle}
                    onEdit={openReminderSheet}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
