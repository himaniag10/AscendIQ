import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';

const sidebarItems = ['Dashboard', 'Interviews', 'Analytics', 'Goals', 'Profile', 'Settings'];
const history = [
  ['Frontend Engineer Mock', '86%', '32 min', 'Today'],
  ['Behavioral Interview', '78%', '24 min', 'Yesterday'],
  ['System Design Round', '71%', '41 min', 'Jun 10'],
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
          {sidebarItems.map((item) => (
            <button
              key={item}
              className={`w-full rounded-lg px-3 py-3 text-left text-sm font-medium transition ${
                item === 'Dashboard'
                  ? 'bg-[var(--theme-primary)] text-white'
                  : 'text-[var(--theme-secondary-text)] hover:bg-[var(--theme-surface-alt)] hover:text-[var(--theme-text)]'
              }`}
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>

      <div className="space-y-6">
        <section className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-[var(--theme-primary)]">Welcome back</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--theme-text)]">{user?.name || 'AscendIQ User'}</h1>
              <p className="mt-2 text-sm text-[var(--theme-secondary-text)]">Track readiness, review weak spots, and plan your next interview practice session.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button>Start Interview</Button>
              <Button variant="secondary">View Analytics</Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card title="Interviews Completed" value="8" description="Completed practice sessions this month." icon="+" />
          <Card title="Current Streak" value="5 days" description="Your continuous preparation rhythm." icon="o" />
          <Card title="Readiness Score" value="82%" description="Composite score across recent sessions." icon="*" />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
          <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase text-[var(--theme-muted-text)]">Score Graph</p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--theme-text)]">Readiness trend</h2>
              </div>
              <span className="rounded-lg bg-[var(--theme-primary-soft)] px-3 py-2 text-sm font-semibold text-[var(--theme-primary)]">+14%</span>
            </div>
            <div className="mt-8 flex h-64 items-end gap-3 rounded-xl bg-[var(--theme-surface-alt)] p-5">
              {[44, 52, 49, 61, 68, 75, 82].map((height, index) => (
                <div key={index} className="flex flex-1 flex-col items-center gap-3">
                  <div className="w-full rounded-t-lg bg-[var(--theme-primary)]" style={{ height: `${height * 2}px`, opacity: 0.55 + index * 0.06 }} />
                  <span className="text-xs text-[var(--theme-muted-text)]">S{index + 1}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase text-[var(--theme-muted-text)]">Weakness Tracker</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--theme-text)]">Focus this week</h2>
            <div className="mt-6 space-y-4">
              {[
                ['System design', 62],
                ['Answer structure', 68],
                ['Database indexing', 73],
                ['Behavioral examples', 77],
              ].map(([topic, score]) => (
                <div key={topic}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-[var(--theme-text)]">{topic}</span>
                    <span className="text-[var(--theme-secondary-text)]">{score}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[var(--theme-border)]">
                    <div className="h-2 rounded-full bg-[var(--theme-warning)]" style={{ width: `${score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[var(--theme-text)]">Interview History</h2>
            <div className="mt-5 overflow-hidden rounded-xl border border-[var(--theme-border)]">
              {history.map(([name, score, duration, date]) => (
                <div key={name} className="grid grid-cols-[1fr_auto] gap-4 border-b border-[var(--theme-border)] p-4 last:border-b-0 sm:grid-cols-[1fr_auto_auto_auto]">
                  <p className="font-medium text-[var(--theme-text)]">{name}</p>
                  <p className="text-sm font-semibold text-[var(--theme-primary)]">{score}</p>
                  <p className="hidden text-sm text-[var(--theme-secondary-text)] sm:block">{duration}</p>
                  <p className="hidden text-sm text-[var(--theme-muted-text)] sm:block">{date}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[var(--theme-text)]">Learning Path</h2>
            <div className="mt-5 space-y-3">
              {['Redo system design fundamentals', 'Practice concise STAR answers', 'Review SQL query planning'].map((item, index) => (
                <div key={item} className="flex gap-3 rounded-xl bg-[var(--theme-surface-alt)] p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-primary-soft)] text-sm font-bold text-[var(--theme-primary)]">{index + 1}</span>
                  <p className="text-sm font-medium text-[var(--theme-secondary-text)]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default DashboardPage;
