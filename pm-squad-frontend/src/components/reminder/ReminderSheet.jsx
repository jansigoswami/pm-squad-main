import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUiStore } from '../../store/uiStore';
import { useReminderStore } from '../../store/reminderStore';
import BottomSheet from '../ui/BottomSheet';
import Toggle from '../ui/Toggle';
import { cn } from '../../lib/utils';

const TIME_PICKS = [
  { v: '08:00', label: '8:00 AM' },
  { v: '09:00', label: '9:00 AM' },
  { v: '09:30', label: '9:30 AM' },
  { v: '10:00', label: '10:00 AM' },
  { v: '12:00', label: '12:00 PM' },
  { v: '17:00', label: '5:00 PM' },
];
const REPEATS = [
  { v: 'daily', label: 'Daily' },
  { v: 'weekdays', label: 'Weekdays' },
  { v: 'weekly', label: 'Weekly' },
  { v: 'biweekly', label: 'Bi-weekly' },
  { v: 'monthly', label: 'Monthly' },
  { v: 'once', label: 'Once' },
];

const empty = {
  title: '',
  forAll: false,
  time: '09:00',
  repeat: 'daily',
  channel: 'app',
  isActive: true,
};

export default function ReminderSheet() {
  const isOpen = useUiStore((s) => s.reminderSheetOpen);
  const data = useUiStore((s) => s.reminderSheetData);
  const close = useUiStore((s) => s.closeReminderSheet);
  const createReminder = useReminderStore((s) => s.createReminder);
  const updateReminder = useReminderStore((s) => s.updateReminder);

  const editMode = !!data;
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(data ? { ...empty, ...data } : empty);
  }, [isOpen, data]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.title.trim()) {
      toast.error('Give your reminder a name');
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      forAll: form.forAll,
      time: form.time,
      repeat: form.repeat,
      channel: form.channel,
      isActive: form.isActive,
    };
    try {
      if (editMode) await updateReminder(data._id, payload);
      else await createReminder(payload);
      toast.success(editMode ? 'Reminder updated' : 'Reminder created');
      close();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save reminder');
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-600';

  const chip = (active) =>
    cn(
      'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150',
      active
        ? 'bg-brand-600 text-white border-transparent'
        : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'
    );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={close}
      title={editMode ? 'Edit Reminder' : 'New Reminder'}
      maxHeight="90vh"
    >
      <div className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Reminder name
          </label>
          <input
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="e.g. Daily standup"
            className={inputCls}
            autoFocus
          />
        </div>

        {/* Remind who */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Remind
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => set('forAll', false)}
              className={chip(!form.forAll)}
            >
              Myself
            </button>
            <button
              onClick={() => set('forAll', true)}
              className={chip(form.forAll)}
            >
              Everyone
            </button>
          </div>
        </div>

        {/* Time */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Time
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 mb-2">
            {TIME_PICKS.map((t) => (
              <button
                key={t.v}
                onClick={() => set('time', t.v)}
                className={chip(form.time === t.v)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <input
            type="time"
            value={form.time}
            onChange={(e) => set('time', e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Repeat */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Repeat
          </label>
          <div className="flex flex-wrap gap-2">
            {REPEATS.map((r) => (
              <button
                key={r.v}
                onClick={() => set('repeat', r.v)}
                className={chip(form.repeat === r.v)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Channel */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Channel
          </label>
          <div className="flex gap-2">
            <button className={chip(true)}>In-app</button>
            <button
              disabled
              title="Coming soon"
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed"
            >
              Email
            </button>
            <button
              disabled
              title="Coming soon"
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed"
            >
              Slack
            </button>
          </div>
        </div>

        {/* Active */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Active
          </label>
          <Toggle value={form.isActive} onChange={(v) => set('isActive', v)} />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={close}
            className="px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-brand-700 hover:bg-brand-600 text-white text-sm font-medium disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </motion.button>
        </div>
      </div>
    </BottomSheet>
  );
}
