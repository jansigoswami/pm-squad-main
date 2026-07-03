import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Lock,
  Plus,
  Trash2,
  X,
  Send,
  Pencil,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useUiStore } from '../../store/uiStore';
import { useTaskStore } from '../../store/taskStore';
import { useAuthStore } from '../../store/authStore';
import { canDelete } from '../../utils/permissionUtils';
import { timeAgo } from '../../utils/dateUtils';
import { cn } from '../../lib/utils';
import BottomSheet from '../ui/BottomSheet';
import Avatar from '../ui/Avatar';

const SUGGESTED_LABELS = ['design', 'research', 'urgent', 'review', 'meeting'];
const REMINDER_OPTIONS = [
  { value: '', label: 'No reminder' },
  { value: 'at', label: 'At due time' },
  { value: '1h', label: '1 hour before' },
  { value: '1d', label: '1 day before' },
  { value: '2d', label: '2 days before' },
  { value: '1w', label: '1 week before' },
];

// ISO date → yyyy-mm-dd for <input type=date>.
const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

const emptyForm = (defaults = {}) => ({
  type: 'work',
  title: '',
  status: 'todo',
  priority: 'normal',
  due: '',
  reminder: '',
  labels: [],
  subtasks: [],
  notes: '',
  ...defaults,
});

export default function TaskSheet() {
  const isOpen = useUiStore((s) => s.taskSheetOpen);
  const data = useUiStore((s) => s.taskSheetData);
  const defaults = useUiStore((s) => s.taskSheetDefaults);
  const closeTaskSheet = useUiStore((s) => s.closeTaskSheet);
  const createTask = useTaskStore((s) => s.createTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const user = useAuthStore((s) => s.user);

  const editMode = !!data;

  const [tab, setTab] = useState('details');
  const [form, setForm] = useState(emptyForm());
  const [labelInput, setLabelInput] = useState('');
  const [subInput, setSubInput] = useState('');
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [shake, setShake] = useState(0);
  const titleRef = useRef(null);

  // Reset form whenever the sheet opens.
  useEffect(() => {
    if (!isOpen) return;
    setTab('details');
    setConfirmDelete(false);
    if (data) {
      setForm({
        type: data.type || 'work',
        title: data.title || '',
        status: data.status || 'todo',
        priority: data.priority || 'normal',
        due: toDateInput(data.due),
        reminder: data.reminder || '',
        labels: data.labels || [],
        subtasks: (data.subtasks || []).map((s) => ({
          text: s.text,
          done: !!s.done,
        })),
        notes: data.notes || '',
      });
      setShowSubtasks((data.subtasks || []).length > 0);
    } else {
      setForm(emptyForm({ due: defaults?.due ? toDateInput(defaults.due) : '' }));
      setShowSubtasks(false);
    }
    setTimeout(() => titleRef.current?.focus(), 250);
  }, [isOpen, data, defaults]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const addLabel = (raw) => {
    const l = (raw || labelInput).trim().toLowerCase();
    if (l && !form.labels.includes(l)) set('labels', [...form.labels, l]);
    setLabelInput('');
  };
  const removeLabel = (l) =>
    set('labels', form.labels.filter((x) => x !== l));

  const addSubtask = () => {
    const t = subInput.trim();
    if (!t) return;
    set('subtasks', [...form.subtasks, { text: t, done: false }]);
    setSubInput('');
  };
  const toggleSub = (i) =>
    set(
      'subtasks',
      form.subtasks.map((s, idx) =>
        idx === i ? { ...s, done: !s.done } : s
      )
    );
  const updateSubText = (i, text) =>
    set(
      'subtasks',
      form.subtasks.map((s, idx) => (idx === i ? { ...s, text } : s))
    );
  const removeSub = (i) =>
    set('subtasks', form.subtasks.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!form.title.trim()) {
      setShake((n) => n + 1);
      return;
    }
    setSaving(true);
    const payload = {
      type: form.type,
      title: form.title.trim(),
      status: form.status,
      priority: form.priority,
      due: form.due ? new Date(form.due).toISOString() : null,
      reminder: form.reminder,
      labels: form.labels,
      subtasks: form.subtasks,
      notes: form.notes,
    };
    try {
      if (editMode) {
        await updateTask(data._id, payload);
        toast.success('Task updated');
      } else {
        await createTask(payload);
        toast.success('Task created');
      }
      closeTaskSheet();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save task');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask(data._id);
      toast.success('Task deleted');
      closeTaskSheet();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete task');
    }
  };

  const canDel = editMode && canDelete(data, user);
  const isPersonal = form.type === 'personal';

  const inputCls =
    'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-600';

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={closeTaskSheet}
      title={editMode ? 'Edit Task' : 'New Task'}
      maxHeight="95vh"
    >
      {/* Tabs (Activity only in edit mode) */}
      {editMode && (
        <div className="flex gap-1 mb-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
          {['details', 'activity'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all duration-150',
                tab === t
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {tab === 'details' && (
        <div className="space-y-5">
          {/* Type toggle */}
          <div className="flex gap-2">
            {[
              { v: 'work', icon: Briefcase, on: 'bg-amber-500' },
              { v: 'personal', icon: Lock, on: 'bg-purple-500' },
            ].map(({ v, icon: Icon, on }) => (
              <button
                key={v}
                onClick={() => set('type', v)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border transition-all duration-150 capitalize',
                  form.type === v
                    ? `${on} text-white border-transparent`
                    : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'
                )}
              >
                <Icon className="h-4 w-4" /> {v}
              </button>
            ))}
          </div>

          {/* Title */}
          <motion.input
            key={shake}
            ref={titleRef}
            animate={shake ? { x: [0, -8, 8, -8, 8, 0] } : {}}
            transition={{ duration: 0.4 }}
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="What needs to be done?"
            className={cn(
              'w-full px-3 py-2.5 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base font-medium focus:outline-none focus:ring-2 focus:ring-brand-600',
              !form.title.trim() && shake
                ? 'border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            )}
          />

          {/* Quick fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className={inputCls}
              >
                <option value="todo">To Do</option>
                <option value="inprog">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => set('priority', e.target.value)}
                className={inputCls}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Due date
              </label>
              <input
                type="date"
                value={form.due}
                onChange={(e) => set('due', e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Labels
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.labels.map((l) => (
                <span
                  key={l}
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-600/20 dark:text-brand-300"
                >
                  {l}
                  <button onClick={() => removeLabel(l)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <input
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addLabel();
                }
              }}
              placeholder="Type a label and press Enter"
              className={inputCls}
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {SUGGESTED_LABELS.filter((l) => !form.labels.includes(l)).map(
                (l) => (
                  <button
                    key={l}
                    onClick={() => addLabel(l)}
                    className="text-xs px-2 py-0.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    + {l}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Subtasks */}
          <div>
            {!showSubtasks ? (
              <button
                onClick={() => setShowSubtasks(true)}
                className="flex items-center gap-1 text-sm text-brand-600 hover:underline"
              >
                <Plus className="h-4 w-4" /> Add subtask
              </button>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-500">
                  Subtasks
                </label>
                {form.subtasks.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={s.done}
                      onChange={() => toggleSub(i)}
                      className="h-4 w-4 accent-brand-600"
                    />
                    <input
                      value={s.text}
                      onChange={(e) => updateSubText(i, e.target.value)}
                      className={cn(inputCls, 'flex-1', s.done && 'line-through text-gray-400')}
                    />
                    <button
                      onClick={() => removeSub(i)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <input
                    value={subInput}
                    onChange={(e) => setSubInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSubtask();
                      }
                    }}
                    placeholder="Add item"
                    className={cn(inputCls, 'flex-1')}
                  />
                  <button
                    onClick={addSubtask}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Reminder */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Reminder
            </label>
            <select
              value={form.reminder}
              onChange={(e) => set('reminder', e.target.value)}
              className={inputCls}
            >
              {REMINDER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              placeholder="Add notes..."
              className={cn(inputCls, 'resize-y')}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
            <div>
              {canDel &&
                (confirmDelete ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Sure?</span>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="px-2 py-1 rounded text-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-2 py-1 rounded bg-red-500 text-white"
                    >
                      Delete
                    </button>
                  </div>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1.5 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </motion.button>
                ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={closeTaskSheet}
                className="px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-brand-700 hover:bg-brand-600 text-white text-sm font-medium disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {tab === 'activity' && editMode && (
        <ActivityTab task={data} currentUser={user} />
      )}
    </BottomSheet>
  );
}

/* ---------------- Activity tab (comments + log) ---------------- */

function ActivityTab({ task, currentUser }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState([]);
  const [mentionQuery, setMentionQuery] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get(`/tasks/${task._id}/comments`)
      .then(({ data }) => active && setComments(data.data || []))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    api
      .get('/users')
      .then(({ data }) => active && setUsers(data.data || []))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [task._id]);

  // Derive a lightweight activity log from task metadata.
  const log = useMemo(() => {
    const entries = [
      {
        icon: Plus,
        message: 'Task created',
        when: task.createdAt,
      },
    ];
    if (task.lastEditedBy && task.updatedAt) {
      entries.push({
        icon: Pencil,
        message: `Edited by ${task.lastEditedBy?.name || 'someone'}`,
        when: task.updatedAt,
      });
    }
    return entries;
  }, [task]);

  const onChange = (e) => {
    const val = e.target.value;
    setText(val);
    const m = val.slice(0, e.target.selectionStart).match(/@(\w*)$/);
    setMentionQuery(m ? m[1].toLowerCase() : null);
  };

  const pickMention = (u) => {
    const first = u.name.split(' ')[0];
    setText((t) => t.replace(/@(\w*)$/, `@${first} `));
    setMentionQuery(null);
  };

  const submit = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const { data } = await api.post(`/tasks/${task._id}/comments`, {
        text: text.trim(),
      });
      setComments((c) => [...c, data.data]);
      setText('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add comment');
    } finally {
      setSending(false);
    }
  };

  const removeComment = async (id) => {
    try {
      await api.delete(`/tasks/${task._id}/comments/${id}`);
      setComments((c) => c.filter((x) => x._id !== id));
    } catch {
      toast.error('Could not delete comment');
    }
  };

  const matches =
    mentionQuery !== null
      ? users
          .filter((u) => u.name.toLowerCase().includes(mentionQuery))
          .slice(0, 5)
      : [];

  return (
    <div className="space-y-5">
      {/* Comments */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
          Comments
        </h3>
        <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-gray-400">No comments yet.</p>
          ) : (
            comments.map((c) => (
              <div key={c._id} className="group flex gap-2">
                <Avatar user={c.author} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {c.author?.name}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {timeAgo(c.createdAt)}
                    </span>
                    {c.author?._id === currentUser?._id && (
                      <button
                        onClick={() => removeComment(c._id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 break-words">
                    {c.text}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment input */}
        <div className="relative mt-3">
          {matches.length > 0 && (
            <div className="absolute bottom-full mb-1 w-56 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg z-10">
              {matches.map((u) => (
                <button
                  key={u._id}
                  onClick={() => pickMention(u)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Avatar user={u} size="sm" />
                  {u.name}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={onChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={2}
              placeholder="Add a comment... use @ to mention"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 resize-none"
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={submit}
              disabled={sending}
              className="p-2.5 rounded-lg bg-brand-700 hover:bg-brand-600 text-white disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Activity log timeline */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
          Activity
        </h3>
        <div className="relative pl-5">
          <span className="absolute left-1.5 top-1 bottom-1 w-px bg-gray-200 dark:bg-gray-700" />
          {log.map((e, i) => (
            <div key={i} className="relative mb-3 flex items-center gap-2">
              <span className="absolute -left-[14px] h-3 w-3 rounded-full bg-brand-500 ring-2 ring-white dark:ring-gray-900" />
              <e.icon className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {e.message}
              </span>
              <span className="text-[11px] text-gray-400">
                {timeAgo(e.when)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
