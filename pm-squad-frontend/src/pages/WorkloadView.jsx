import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Users } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import Avatar from '../components/ui/Avatar';
import EmptyState from '../components/ui/EmptyState';
import SkeletonList from '../components/ui/Skeleton';

function Bar({ done, open, blocked }) {
  const total = done + open + blocked || 1;
  const seg = (n, cls) =>
    n > 0 ? (
      <div className={cls} style={{ width: `${(n / total) * 100}%` }} />
    ) : null;
  return (
    <div className="flex h-2 w-full rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
      {seg(done, 'bg-green-500')}
      {seg(open, 'bg-blue-500')}
      {seg(blocked, 'bg-red-500')}
    </div>
  );
}

function StatBox({ label, value, cls }) {
  return (
    <div className="rounded-lg bg-gray-50 dark:bg-gray-700/40 p-2 text-center">
      <div className={`text-lg font-bold ${cls}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-gray-400">
        {label}
      </div>
    </div>
  );
}

export default function WorkloadView() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'boss') navigate('/today', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    let active = true;
    api
      .get('/users/workload')
      .then(({ data }) => active && setRows(data.data || []))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const totals = rows.reduce(
    (acc, r) => ({
      total: acc.total + r.total,
      done: acc.done + r.done,
      blocked: acc.blocked + r.blocked,
    }),
    { total: 0, done: 0, blocked: 0 }
  );
  const completion =
    totals.total > 0 ? Math.round((totals.done / totals.total) * 100) : 0;

  if (loading) return <SkeletonList count={4} />;
  if (rows.length === 0)
    return <EmptyState icon={Users} title="No workload data yet" />;

  return (
    <div className="space-y-5">
      {/* Team summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-blue-50 dark:bg-blue-900/30 p-4">
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {totals.total}
          </div>
          <div className="text-xs text-blue-600/80 dark:text-blue-400">
            Total tasks
          </div>
        </div>
        <div className="rounded-xl bg-green-50 dark:bg-green-900/30 p-4">
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
            {completion}%
          </div>
          <div className="text-xs text-green-600/80 dark:text-green-400">
            Completion
          </div>
        </div>
        <div className="rounded-xl bg-red-50 dark:bg-red-900/30 p-4">
          <div className="text-2xl font-bold text-red-700 dark:text-red-300">
            {totals.blocked}
          </div>
          <div className="text-xs text-red-600/80 dark:text-red-400">
            Blocked
          </div>
        </div>
      </div>

      {/* Per-user cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rows.map((r) => (
          <div
            key={r.user._id || r.user.name}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <Avatar user={r.user} size="lg" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {r.user.name}
                </p>
                {r.blocked > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-red-600">
                    <AlertTriangle className="h-3 w-3" /> Has blocked tasks
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-3">
              <StatBox label="Total" value={r.total} cls="text-gray-700 dark:text-gray-200" />
              <StatBox label="Open" value={r.open} cls="text-blue-600" />
              <StatBox label="Done" value={r.done} cls="text-green-600" />
              <StatBox label="Blocked" value={r.blocked} cls="text-red-600" />
            </div>

            <Bar done={r.done} open={r.open} blocked={r.blocked} />
          </div>
        ))}
      </div>
    </div>
  );
}
