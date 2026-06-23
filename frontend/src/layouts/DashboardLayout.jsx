import { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';

const sidebarItems = [
  ['Dashboard', '/dashboard'],
  ['Interviews', '/interviews'],
  ['Goals', '/goals'],
  ['Profile', '/profile'],
];

export function DashboardLayout({ children }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
      {/* Sidebar */}
      <aside className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 shadow-sm lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
        <div className="rounded-xl bg-[var(--theme-surface-alt)] p-4">
          <p className="text-xs font-semibold uppercase text-[var(--theme-muted-text)]">Workspace</p>
          <p className="mt-2 truncate font-semibold text-[var(--theme-text)]">{user?.name || 'AscendIQ User'}</p>
          <p className="mt-1 truncate text-sm text-[var(--theme-secondary-text)]">{user?.email}</p>
        </div>
        <nav className="mt-4 space-y-1">
          {sidebarItems.map(([item, href]) => {
            const isActive = location.pathname.startsWith(href);
            return (
              <Link
                key={item}
                to={href}
                className={`block rounded-lg px-3 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-[var(--theme-primary)] text-white'
                    : 'text-[var(--theme-secondary-text)] hover:bg-[var(--theme-surface-alt)] hover:text-[var(--theme-text)]'
                }`}
              >
                {item}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}
