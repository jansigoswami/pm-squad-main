import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

/**
 * Gate for authenticated routes. Renders nested routes when logged in,
 * otherwise redirects to /login.
 */
export default function PrivateRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
