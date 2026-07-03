import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useTaskStore } from '../store/taskStore';
import StatBar from '../components/ui/StatBar';
import TeamBoard from './TeamBoard';
import WorkloadView from './WorkloadView';
import AnalyticsView from './AnalyticsView';
import { cn } from '../lib/utils';

const TABS = ['Board', 'Workload', 'Analytics'];

export default function BossDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const tasks = useTaskStore((s) => s.tasks);
  const [tab, setTab] = useState('Board');

  // Boss-only guard.
  useEffect(() => {
    if (user && user.role !== 'boss') navigate('/today', { replace: true });
  }, [user, navigate]);

  if (user?.role !== 'boss') return null;

  const workTasks = tasks.filter((t) => t.type === 'work');
  const blockedCount = workTasks.filter((t) => t.status === 'blocked').length;

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150 whitespace-nowrap',
              tab === t
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Board' && (
        <div className="flex-1 flex flex-col min-h-0">
          <StatBar tasks={workTasks} />
          {blockedCount > 0 && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
              <AlertTriangle className="h-4 w-4" />
              {blockedCount} task{blockedCount > 1 ? 's are' : ' is'} blocked —
              needs attention.
            </div>
          )}
          <div className="flex-1 min-h-0 mt-4">
            <TeamBoard canEditAll />
          </div>
        </div>
      )}

      {tab === 'Workload' && <WorkloadView />}
      {tab === 'Analytics' && <AnalyticsView />}
    </div>
  );
}
