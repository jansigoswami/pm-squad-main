import { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PrivateRoute from './components/layout/PrivateRoute';
import AppLayout from './components/layout/AppLayout';

import TodayView from './pages/TodayView';
import MyTasksView from './pages/MyTasksView';
import TeamBoard from './pages/TeamBoard';
import CalendarView from './pages/CalendarView';
import RemindersView from './pages/RemindersView';
import BossDashboard from './pages/BossDashboard';
import WorkloadView from './pages/WorkloadView';
import AnalyticsView from './pages/AnalyticsView';

import { useAuthStore } from './store/authStore';
import { useUiStore } from './store/uiStore';

// Sends a logged-in user to their role's default landing page.
function RoleRedirect() {
  const user = useAuthStore((s) => s.user);
  return (
    <Navigate to={user?.role === 'boss' ? '/dashboard' : '/today'} replace />
  );
}

export default function App() {
  const initDark = useUiStore((s) => s.initDark);

  useEffect(() => {
    initDark();
  }, [initDark]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Private */}
        <Route element={<PrivateRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<RoleRedirect />} />

            {/* PM views */}
            <Route path="today" element={<TodayView />} />
            <Route path="my-tasks" element={<MyTasksView />} />
            <Route path="team" element={<TeamBoard />} />
            <Route path="calendar" element={<CalendarView />} />
            <Route path="reminders" element={<RemindersView />} />

            {/* Boss views */}
            <Route path="dashboard" element={<BossDashboard />} />
            <Route path="workload" element={<WorkloadView />} />
            <Route path="analytics" element={<AnalyticsView />} />
          </Route>
        </Route>

        {/* Fallback → role landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster position="bottom-center" />
    </BrowserRouter>
  );
}
