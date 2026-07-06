import {
  Home,
  CheckSquare,
  Users,
  Calendar,
  Bell,
  LayoutDashboard,
  BarChart2,
  TrendingUp,
} from 'lucide-react';

export const PM_NAV = [
  { to: '/today', label: 'Today', icon: Home },
  { to: '/my-tasks', label: 'My Tasks', icon: CheckSquare },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/reminders', label: 'Reminders', icon: Bell },
];

export const BOSS_NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/workload', label: 'Workload', icon: BarChart2 },
  { to: '/analytics', label: 'Analytics', icon: TrendingUp },
  { to: '/reminders', label: 'Reminders', icon: Bell },
];

// Extra nav items (boss has My Tasks too, but it's not in the 5-item bottom nav).
export const BOSS_EXTRA_NAV = [
  { to: '/my-tasks', label: 'My Tasks', icon: CheckSquare },
];

export function navForRole(role) {
  return role === 'boss' ? BOSS_NAV : PM_NAV;
}

// Map a pathname to a human page title.
const TITLES = {
  '/today': 'Today',
  '/my-tasks': 'My Tasks',
  '/team': 'Team Board',
  '/calendar': 'Calendar',
  '/reminders': 'Reminders',
  '/dashboard': 'Dashboard',
  '/workload': 'Workload',
  '/analytics': 'Analytics',
};

export function titleForPath(pathname) {
  return TITLES[pathname] || 'PM Squad';
}
