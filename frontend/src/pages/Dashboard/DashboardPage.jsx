import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';

const sidebarItems = [
  ['Dashboard', '/dashboard'],
  ['Interviews', '/dashboard'],
  ['Analytics', '/dashboard'],
  ['Goals', '/dashboard'],
  ['Profile', '/profile'],
  ['Settings', '/profile'],
];

function DashboardPage() {
  const { user } = useContext(AuthContext);

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
      <aside className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 shadow-sm lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
        <div className="rounded-xl bg-[var(--theme-surface-alt)] p-4">
          <p className="text-xs font-semibold uppercase text-[var(--theme-muted-text)]">Workspace</p>
          <p className="mt-2 truncate font-semibold text-[var(--theme-text)]">{user?.name || 'AscendIQ User'}</p>
          <p className="mt-1 truncate text-sm text-[var(--theme-secondary-text)]">{user?.email}</p>
        </div>
        <nav className="mt-4 space-y-1">
          {sidebarItems.map(([item, href]) => (
            <Link
              key={item}
              to={href}
              className={`block rounded-lg px-3 py-3 text-sm font-medium transition ${
                item === 'Dashboard'
                  ? 'bg-[var(--theme-primary)] text-white'
                  : 'text-[var(--theme-secondary-text)] hover:bg-[var(--theme-surface-alt)] hover:text-[var(--theme-text)]'
              }`}
            >
              {item}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="space-y-6">
        <section className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-[var(--theme-primary)]">Welcome back</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--theme-text)]">{user?.name || 'AscendIQ User'}</h1>
              <p className="mt-2 text-sm text-[var(--theme-secondary-text)]">Your analytics will appear after you complete real interview sessions.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button>Start Interview</Button>
              <Link to="/profile">
                <Button variant="secondary">Complete Profile</Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Card title="Interviews Completed" value="0" description="No interviews completed yet." icon="0" />
          <Card title="Current Streak" value="0" description="Start your first interview to begin a streak." icon="0" />
          <Card title="Readiness Score" value="0%" description="Complete interviews to calculate readiness." icon="0" />
          <Card title="Goals Completed" value="0" description="No goals completed yet." icon="0" />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
          <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase text-[var(--theme-muted-text)]">Analytics</p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--theme-text)]">Readiness trend</h2>
              </div>
              <span className="rounded-lg bg-[var(--theme-surface-alt)] px-3 py-2 text-sm font-semibold text-[var(--theme-secondary-text)]">0%</span>
            </div>
            <div className="mt-6">
              <EmptyState
                title="No analytics yet"
                description="Start your first interview to see readiness trends, scoring patterns, and improvement signals."
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase text-[var(--theme-muted-text)]">Weakness Tracker</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--theme-text)]">Focus areas</h2>
            <div className="mt-6">
              <EmptyState
                title="No weak topics yet"
                description="Weak topics will appear only after AscendIQ evaluates real interview attempts."
              />
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[var(--theme-text)]">Interview History</h2>
            <div className="mt-5">
              <EmptyState
                title="No interviews completed yet"
                description="Your completed interview sessions, scores, and review links will appear here."
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[var(--theme-text)]">Learning Path</h2>
            <div className="mt-5">
              <EmptyState
                title="No learning path yet"
                description="Complete an interview so AscendIQ can generate a path from real performance data."
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default DashboardPage;
