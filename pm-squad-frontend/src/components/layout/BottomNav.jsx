import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { navForRole } from '../../utils/navConfig';
import { cn } from '../../lib/utils';

/**
 * Mobile-only bottom tab bar with a sliding active indicator.
 */
export default function BottomNav() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const items = navForRole(user?.role).slice(0, 5);

  const activeIndex = items.findIndex((i) =>
    location.pathname.startsWith(i.to)
  );

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 h-14 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      {/* Sliding indicator */}
      <div className="relative h-full">
        {activeIndex >= 0 && (
          <motion.div
            className="absolute top-0 h-0.5 bg-brand-600 rounded-full"
            style={{ width: `${100 / items.length}%` }}
            animate={{ left: `${(activeIndex * 100) / items.length}%` }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          />
        )}

        <div className="flex h-full">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] transition-colors duration-150',
                  isActive
                    ? 'text-brand-600 font-medium'
                    : 'text-gray-500 dark:text-gray-400'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className="h-5 w-5"
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
