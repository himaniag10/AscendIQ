import { Link, NavLink } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useTheme } from '../../theme/useTheme.js';
import { Button } from '../ui/Button.jsx';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '/#features' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'About', href: '/#about' },
];

const themeOptions = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' },
];

export function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { mode, setMode } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const initials = (user?.name || user?.email || 'A')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--theme-border)] bg-[var(--theme-background)]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--theme-primary)] text-sm font-black text-white shadow-sm">
              AI
            </span>
            <span>
              <span className="block text-base font-semibold tracking-tight text-[var(--theme-text)]">AscendIQ</span>
              <span className="hidden text-xs text-[var(--theme-muted-text)] sm:block">Interview readiness</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                className={({ isActive }) =>
                  `text-sm font-medium transition ${
                    isActive ? 'text-[var(--theme-primary)]' : 'text-[var(--theme-secondary-text)] hover:text-[var(--theme-text)]'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {!user ? (
            <div className="hidden items-center gap-3 md:flex">
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/register">
                <Button>Register</Button>
              </Link>
            </div>
          ) : (
            <div className="relative hidden md:block">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] text-sm font-semibold text-[var(--theme-text)] transition hover:border-[var(--theme-border-strong)]"
                aria-label="Open profile menu"
              >
                {initials}
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-3 w-64 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 shadow-[var(--theme-shadow)]">
                  <p className="px-2 text-xs font-semibold uppercase text-[var(--theme-muted-text)]">Signed in as</p>
                  <p className="truncate px-2 pt-1 text-sm font-semibold text-[var(--theme-text)]">{user.name || user.email}</p>
                  <div className="my-3 h-px bg-[var(--theme-border)]" />
                  {['Dashboard', 'Profile', 'Settings'].map((item) => (
                    <Link
                      key={item}
                      to="/dashboard"
                      className="block rounded-lg px-3 py-2 text-sm text-[var(--theme-secondary-text)] hover:bg-[var(--theme-surface-alt)] hover:text-[var(--theme-text)]"
                    >
                      {item}
                    </Link>
                  ))}
                  <label className="mt-2 block px-3 py-2 text-sm text-[var(--theme-secondary-text)]">
                    <span className="mb-2 block text-xs font-semibold uppercase text-[var(--theme-muted-text)]">Theme</span>
                    <select
                      value={mode}
                      onChange={(event) => setMode(event.target.value)}
                      className="w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-alt)] px-3 py-2 text-[var(--theme-text)] outline-none"
                    >
                      {themeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    onClick={logout}
                    className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[var(--theme-danger)] hover:bg-[var(--theme-surface-alt)]"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setMobileOpen((value) => !value)}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 text-sm font-semibold text-[var(--theme-text)] md:hidden"
          >
            Menu
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-4 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--theme-secondary-text)] hover:bg-[var(--theme-surface-alt)]"
              >
                {link.label}
              </Link>
            ))}
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value)}
              className="mt-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-alt)] px-3 py-3 text-sm text-[var(--theme-text)]"
            >
              {themeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} theme
                </option>
              ))}
            </select>
            {!user ? (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Link to="/login">
                  <Button variant="secondary" className="w-full">Login</Button>
                </Link>
                <Link to="/register">
                  <Button className="w-full">Register</Button>
                </Link>
              </div>
            ) : (
              <button onClick={logout} className="mt-3 rounded-lg bg-[var(--theme-surface-alt)] px-3 py-3 text-left text-sm font-semibold text-[var(--theme-danger)]">
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
