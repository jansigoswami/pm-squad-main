import toast from 'react-hot-toast';
import { useTaskStore } from '../../store/taskStore';
import BottomSheet from '../ui/BottomSheet';
import { cn } from '../../lib/utils';

const STATUSES = [
  { v: 'todo', label: 'To Do', cls: 'bg-gray-500' },
  { v: 'inprog', label: 'In Progress', cls: 'bg-blue-500' },
  { v: 'blocked', label: 'Blocked', cls: 'bg-red-500' },
  { v: 'done', label: 'Done', cls: 'bg-green-500' },
];

/**
 * Compact sheet for non-owners to change only a task's status.
 */
export default function MiniStatusSheet({ task, onClose }) {
  const updateTask = useTaskStore((s) => s.updateTask);

  const change = async (status) => {
    try {
      await updateTask(task._id, { status });
      toast.success('Status updated');
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update status');
    }
  };

  return (
    <BottomSheet
      isOpen={!!task}
      onClose={onClose}
      title="Update status"
      maxHeight="250px"
    >
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 truncate">
        {task?.title}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {STATUSES.map((s) => (
          <button
            key={s.v}
            onClick={() => change(s.v)}
            className={cn(
              'py-3 rounded-lg text-sm font-medium text-white transition-all duration-150',
              s.cls,
              task?.status === s.v
                ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-900'
                : 'opacity-80 hover:opacity-100'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
