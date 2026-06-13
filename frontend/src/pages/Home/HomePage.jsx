import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button.jsx';

const metrics = [
  { value: 10000, suffix: '+', label: 'Practice Sessions' },
  { value: 500, suffix: '+', label: 'Interview Questions' },
  { value: 92, suffix: '%', label: 'Readiness Improvement' },
  { value: 50, suffix: '+', label: 'Interview Categories' },
];

const features = [
  'Voice Interviews',
  'Adaptive Questioning',
  'Google-Style Mock Interviews',
  'Readiness Score',
  'Weakness Detection',
  'Interview Replay',
  'Goal Tracking',
  'Personalized Learning Path',
];

const steps = [
  ['01', 'Take Interview', 'Practice in a structured interview room with role-specific prompts.'],
  ['02', 'AI Evaluation', 'Receive crisp feedback across clarity, confidence, depth, and communication.'],
  ['03', 'Weakness Detection', 'See patterns across topics, answer quality, and missed concepts.'],
  ['04', 'Learning Path', 'Follow a focused plan that turns weak areas into repeatable strengths.'],
  ['05', 'Interview Success', 'Track readiness until you are confident for real-world interviews.'],
];

function AnimatedMetric({ value, suffix, label }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 900;
    const start = performance.now();
    let frame;

    const tick = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      setCount(Math.floor(value * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 text-center shadow-sm">
      <p className="text-3xl font-semibold text-[var(--theme-text)]">{count.toLocaleString()}{suffix}</p>
      <p className="mt-2 text-sm font-medium text-[var(--theme-secondary-text)]">{label}</p>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="animate-float rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 shadow-[var(--theme-shadow)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-[var(--theme-muted-text)]">Readiness Score</p>
          <p className="mt-1 text-3xl font-semibold text-[var(--theme-text)]">86%</p>
        </div>
        <span className="rounded-lg bg-[var(--theme-primary-soft)] px-3 py-2 text-xs font-semibold text-[var(--theme-primary)]">Live AI feedback</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-[var(--theme-surface-alt)] p-4">
          <p className="text-xs font-semibold uppercase text-[var(--theme-muted-text)]">Weak Topics</p>
          <div className="mt-4 space-y-3">
            {['System design', 'Behavioral depth', 'SQL joins'].map((item, index) => (
              <div key={item}>
                <div className="flex justify-between text-xs text-[var(--theme-secondary-text)]">
                  <span>{item}</span>
                  <span>{62 + index * 7}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-[var(--theme-border)]">
                  <div className="h-2 rounded-full bg-[var(--theme-warning)]" style={{ width: `${62 + index * 7}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-[var(--theme-surface-alt)] p-4">
          <p className="text-xs font-semibold uppercase text-[var(--theme-muted-text)]">Strong Topics</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['React', 'DSA', 'Projects', 'Communication'].map((topic) => (
              <span key={topic} className="rounded-lg bg-[var(--theme-surface)] px-3 py-2 text-xs font-semibold text-[var(--theme-secondary-text)]">
                {topic}
              </span>
            ))}
          </div>
          <div className="mt-6 rounded-xl bg-[var(--theme-surface)] p-4">
            <p className="text-sm font-semibold text-[var(--theme-text)]">AI Feedback</p>
            <p className="mt-2 text-sm text-[var(--theme-secondary-text)]">Clarify tradeoffs and give one concrete example before closing.</p>
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-xl bg-[var(--theme-surface-alt)] p-4">
        <div className="flex h-28 items-end gap-2">
          {[38, 54, 48, 66, 72, 80, 86].map((height, index) => (
            <div key={height} className="flex-1 rounded-t-lg bg-[var(--theme-primary)]" style={{ height: `${height}%`, opacity: 0.55 + index * 0.06 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function HomePage() {
  return (
    <div className="overflow-hidden">
      <section className="surface-grid border-b border-[var(--theme-border)]">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.92fr] lg:items-center lg:px-8 lg:py-24">
          <div className="animate-reveal max-w-3xl">
            <p className="inline-flex rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-2 text-sm font-semibold text-[var(--theme-secondary-text)]">
              AI-Powered Interview Preparation Ecosystem
            </p>
            <h1 className="mt-6 text-5xl font-semibold tracking-tight text-[var(--theme-text)] sm:text-6xl lg:text-7xl">
              Master Interviews. Track Growth. Get Hired.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--theme-secondary-text)]">
              AI-powered interview preparation platform that helps you practice smarter, identify weaknesses, and build confidence for real-world interviews.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register"><Button>Start Practicing</Button></Link>
              <a href="#dashboard-preview"><Button variant="secondary">Watch Demo</Button></a>
            </div>
          </div>
          <div className="animate-reveal-delay">
            <DashboardMockup />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-4">
          {metrics.map((metric) => <AnimatedMetric key={metric.label} {...metric} />)}
        </div>
      </section>

      <section id="how-it-works" className="border-y border-[var(--theme-border)] bg-[var(--theme-surface)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-[var(--theme-primary)]">How it works</p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--theme-text)]">A clear path from practice to readiness.</h2>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-5">
            {steps.map(([number, title, body]) => (
              <div key={number} className="hover-lift rounded-xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-5">
                <span className="text-sm font-semibold text-[var(--theme-primary)]">{number}</span>
                <h3 className="mt-4 text-lg font-semibold text-[var(--theme-text)]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--theme-secondary-text)]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-[var(--theme-primary)]">Feature showcase</p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--theme-text)]">Everything needed for continuous improvement.</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-[var(--theme-secondary-text)]">
            Built for focused repetition, measurable progress, and confident interview performance.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div key={feature} className="hover-lift rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--theme-primary-soft)] text-sm font-bold text-[var(--theme-primary)]">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-5 text-base font-semibold text-[var(--theme-text)]">{feature}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--theme-secondary-text)]">Premium workflow support for serious interview preparation.</p>
            </div>
          ))}
        </div>
      </section>

      <section id="dashboard-preview" className="border-y border-[var(--theme-border)] bg-[var(--theme-surface)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.7fr_1fr] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase text-[var(--theme-primary)]">Dashboard preview</p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--theme-text)]">Understand readiness at a glance.</h2>
            <p className="mt-4 text-sm leading-6 text-[var(--theme-secondary-text)]">
              Score graph, interview history, readiness percentage, and weakness tracking come together in one calm workspace.
            </p>
          </div>
          <DashboardMockup />
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-8 text-center shadow-sm sm:p-12">
          <h2 className="text-3xl font-semibold text-[var(--theme-text)]">Start Your Interview Journey Today</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[var(--theme-secondary-text)]">
            Create a free account, practice with structure, and turn feedback into measurable career momentum.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/register"><Button>Create Free Account</Button></Link>
            <Link to="/login"><Button variant="secondary">Login</Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
