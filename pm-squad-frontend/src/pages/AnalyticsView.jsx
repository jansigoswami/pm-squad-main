import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Download, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import Avatar from '../components/ui/Avatar';
import SkeletonList from '../components/ui/Skeleton';
import { cn } from '../lib/utils';

const RANGES = ['This Week', 'This Month', 'Last 30 Days'];

function StatCard({ label, value, suffix = '', cls }) {
  return (
    <div className={cn('rounded-xl p-4', cls)}>
      <div className="text-2xl font-bold">
        {value}
        {suffix}
      </div>
      <div className="text-xs opacity-80">{label}</div>
    </div>
  );
}

// Download a boss export endpoint as a file.
async function downloadFile(path, filename) {
  try {
    const res = await api.get(path, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    toast.error('Export failed');
  }
}

export default function AnalyticsView() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [range, setRange] = useState(RANGES[0]);
  const [summary, setSummary] = useState(null);
  const [byUser, setByUser] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'boss') navigate('/today', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get('/analytics/summary'),
      api.get('/analytics/by-user'),
      api.get('/analytics/trend'),
    ])
      .then(([s, u, t]) => {
        if (!active) return;
        setSummary(s.data.data);
        setByUser(u.data.data || []);
        setTrend(t.data.data || []);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <SkeletonList count={4} />;

  return (
    <div className="space-y-5">
      {/* Range chips (visual filter) */}
      <div className="flex gap-2 overflow-x-auto">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150',
              range === r
                ? 'bg-brand-600 text-white border-transparent'
                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'
            )}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Total Tasks"
          value={summary?.totalTasks ?? 0}
          cls="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
        />
        <StatCard
          label="Completion Rate"
          value={summary?.completionRate ?? 0}
          suffix="%"
          cls="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300"
        />
        <StatCard
          label="Blocked"
          value={summary?.blockedCount ?? 0}
          cls="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300"
        />
      </div>

      {/* Trend chart */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
          Weekly completion trend
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
            <XAxis dataKey="week" fontSize={11} stroke="#9ca3af" />
            <YAxis allowDecimals={false} fontSize={11} stroke="#9ca3af" />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#2563EB"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Per-user completion */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
          Per-user completion
        </h3>
        <div className="space-y-3">
          {byUser.map((u) => (
            <div key={u.name} className="flex items-center gap-3">
              <Avatar user={u} size="sm" />
              <span className="text-sm w-24 truncate text-gray-700 dark:text-gray-200">
                {u.name}
              </span>
              <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                <div
                  className="h-full bg-brand-600 rounded-full"
                  style={{ width: `${u.completionRate}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-10 text-right">
                {u.completionRate}%
              </span>
            </div>
          ))}
          {byUser.length === 0 && (
            <p className="text-sm text-gray-400">No data yet.</p>
          )}
        </div>
      </div>

      {/* Export */}
      <div className="flex gap-2">
        <button
          onClick={() => downloadFile('/export/pdf', 'pmsquad-report.pdf')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <FileText className="h-4 w-4" /> Export PDF
        </button>
        <button
          onClick={() => downloadFile('/export/csv', 'pmsquad-tasks.csv')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>
    </div>
  );
}
