import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { navForRole, BOSS_EXTRA_NAV } from '../../utils/navConfig';
import Avatar from '../ui/Avatar';
import { cn } from '../../lib/utils';

function NavItems({ items, collapsed, onNavigate }) {
  return (
    <nav className="flex flex-col gap-1 px-2">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          title={collapsed ? label : undefined}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-600/20 dark:text-brand-400'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
              collapsed && 'justify-center px-0'
            )
          }
        >
          <Icon className="h-5 w-5 shrink-0" />
          {!collapsed && <span>{label}</span>}
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarBody({ collapsed, setCollapsed, onNavigate }) {
  const user = useAuthStore((s) => s.user);
  const items =
    user?.role === 'boss'
      ? [...navForRole('boss'), ...BOSS_EXTRA_NAV]
      : navForRole('pm');

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      <div
        className={cn(
          'h-14 flex items-center px-4 font-bold text-brand-700 dark:text-brand-500',
          collapsed && 'justify-center px-0'
        )}
      >
        {collapsed ? 'PM' : 'PM Squad'}
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <NavItems items={items} collapsed={collapsed} onNavigate={onNavigate} />
      </div>

      {/* User card */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3">
        <div
          className={cn(
            'flex items-center gap-3',
            collapsed && 'justify-center'
          )}
        >
          <Avatar user={user} size="md" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {user?.name}
              </p>
              <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded bg-brand-100 text-brand-700 dark:bg-brand-600/20 dark:text-brand-300 capitalize">
                {user?.role}
              </span>
            </div>
          )}
        </div>

        {setCollapsed && (
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="mt-3 w-full flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-150"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" /> Collapse
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const closeSidebar = useUiStore((s) => s.closeSidebar);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col shrink-0 transition-all duration-200',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        <SidebarBody collapsed={collapsed} setCollapsed={setCollapsed} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            <motion.div
              className="absolute inset-0 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSidebar}
            />
            <motion.div
              className="absolute left-0 top-0 bottom-0 w-64"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <button
                onClick={closeSidebar}
                className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarBody collapsed={false} onNavigate={closeSidebar} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
