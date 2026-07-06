import { useEffect, useState } from 'react';
import { Users, Trash2, Shield } from 'lucide-react';
import api from '../api/axios';
import { useTaskStore } from '../store/taskStore';
import { useAuthStore } from '../store/authStore';
import KanbanColumn from '../components/board/KanbanColumn';
import Avatar from '../components/ui/Avatar';
import EmptyState from '../components/ui/EmptyState';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

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
  const [showManageTeam, setShowManageTeam] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [reassignTo, setReassignTo] = useState(null);

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

  const togglePermission = async (userId, permission) => {
    try {
      const user = users.find((u) => u._id === userId);
      const updatedPermissions = {
        ...user.permissions,
        [permission]: !user.permissions[permission],
      };
      await api.patch(`/users/${userId}/permissions`, updatedPermissions);
      setUsers(users.map((u) => 
        u._id === userId ? { ...u, permissions: updatedPermissions } : u
      ));
      toast.success('Permission updated');
    } catch (err) {
      toast.error('Failed to update permission');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/users/${deleteConfirm}`, {
        data: { reassignTo: reassignTo || null }
      });
      setUsers(users.filter((u) => u._id !== deleteConfirm));
      setDeleteConfirm(null);
      setReassignTo(null);
      toast.success('Team member deleted');
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with Manage Team toggle */}
      <div className="flex items-center justify-between mb-3">
        {/* People filter */}
        <div className="flex gap-2 overflow-x-auto">
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

        {/* Manage Team toggle (Admin only) */}
        {currentUser?.role === 'boss' && (
          <button
            onClick={() => setShowManageTeam(!showManageTeam)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150',
              showManageTeam
                ? 'bg-brand-600 text-white border-transparent'
                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'
            )}
          >
            <Shield className="h-4 w-4" />
            {showManageTeam ? 'Board' : 'Manage Team'}
          </button>
        )}
      </div>

      {/* Manage Team View (Admin only) */}
      {showManageTeam && currentUser?.role === 'boss' ? (
        <div className="flex-1 overflow-y-auto space-y-3">
          {users.filter((u) => u.role !== 'boss').map((u) => (
            <div key={u._id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar user={u} size="md" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{u.name}</p>
                    <span className="text-[10px] uppercase tracking-wide text-gray-400">{u.role}</span>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteConfirm(u._id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-300">Can assign tasks</span>
                  <button
                    onClick={() => togglePermission(u._id, 'canAssignTasks')}
                    className={cn(
                      'w-10 h-5 rounded-full transition-colors',
                      u.permissions?.canAssignTasks ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'
                    )}
                  >
                    <div className={cn(
                      'w-4 h-4 rounded-full bg-white transition-transform',
                      u.permissions?.canAssignTasks ? 'translate-x-5' : 'translate-x-0.5'
                    )} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-300">Can create shared tasks</span>
                  <button
                    onClick={() => togglePermission(u._id, 'canCreateSharedTasks')}
                    className={cn(
                      'w-10 h-5 rounded-full transition-colors',
                      u.permissions?.canCreateSharedTasks ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'
                    )}
                  >
                    <div className={cn(
                      'w-4 h-4 rounded-full bg-white transition-transform',
                      u.permissions?.canCreateSharedTasks ? 'translate-x-5' : 'translate-x-0.5'
                    )} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-300">Can view analytics</span>
                  <button
                    onClick={() => togglePermission(u._id, 'canViewAnalytics')}
                    className={cn(
                      'w-10 h-5 rounded-full transition-colors',
                      u.permissions?.canViewAnalytics ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'
                    )}
                  >
                    <div className={cn(
                      'w-4 h-4 rounded-full bg-white transition-transform',
                      u.permissions?.canViewAnalytics ? 'translate-x-5' : 'translate-x-0.5'
                    )} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Board View */
        <>
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
        </>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Team Member</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              What should happen to their tasks?
            </p>
            <div className="space-y-3 mb-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="radio"
                  name="reassign"
                  value=""
                  checked={!reassignTo}
                  onChange={() => setReassignTo(null)}
                  className="accent-brand-600"
                />
                Archive tasks (set owner to null)
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="radio"
                  name="reassign"
                  value="reassign"
                  checked={!!reassignTo}
                  onChange={() => setReassignTo(currentUser._id)}
                  className="accent-brand-600"
                />
                Reassign to me
              </label>
              <select
                value={reassignTo || ''}
                onChange={(e) => setReassignTo(e.target.value || null)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
              >
                <option value="">Reassign to...</option>
                {users.filter((u) => u._id !== deleteConfirm).map((u) => (
                  <option key={u._id} value={u._id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setDeleteConfirm(null); setReassignTo(null); }}
                className="px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
