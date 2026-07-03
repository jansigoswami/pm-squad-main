import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import api from '../api/axios';
import { useTaskStore } from '../store/taskStore';
import { useAuthStore } from '../store/authStore';
import KanbanColumn from '../components/board/KanbanColumn';
import Avatar from '../components/ui/Avatar';
import EmptyState from '../components/ui/EmptyState';
import { cn } from '../lib/utils';

/**
 * Horizontal swimlane board, one column per team member.
 * `canEditAll` (passed by the boss dashboard) lets every card open the full sheet.
 */
export default function TeamBoard({ canEditAll = false }) {
  const tasks = useTaskStore((s) => s.tasks);
  const currentUser = useAuthStore((s) => s.user);

  const [users, setUsers] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get('/users')
      .then(({ data }) => active && setUsers(data.data || []))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const visibleUsers = activeFilter
    ? users.filter((u) => u._id === activeFilter)
    : users;

  return (
    <div className="h-full flex flex-col">
      {/* People filter */}
      <div className="flex gap-2 overflow-x-auto pb-3">
        <button
          onClick={() => setActiveFilter(null)}
          className={cn(
            'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150',
            !activeFilter
              ? 'bg-brand-600 text-white border-transparent'
              : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'
          )}
        >
          All
        </button>
        {users.map((u) => (
          <button
            key={u._id}
            onClick={() => setActiveFilter(u._id)}
            className={cn(
              'shrink-0 inline-flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full text-xs font-medium border transition-all duration-150',
              activeFilter === u._id
                ? 'bg-brand-600 text-white border-transparent'
                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'
            )}
          >
            <Avatar user={u} size="sm" />
            {u.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Columns */}
      {!loading && users.length === 0 ? (
        <EmptyState icon={Users} title="No team members yet" />
      ) : (
        <div
          className={cn(
            'flex gap-4 overflow-x-auto pb-4 flex-1',
            activeFilter && 'justify-center'
          )}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {visibleUsers.map((u, i) => (
            <KanbanColumn
              key={u._id}
              columnUser={u}
              currentUser={currentUser}
              allTasks={tasks}
              index={i}
              canEditAll={canEditAll}
            />
          ))}
        </div>
      )}
    </div>
  );
}
