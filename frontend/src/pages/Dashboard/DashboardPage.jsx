import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { profileService } from '../../services/profile.service.js';
import { interviewService } from '../../services/interview.service.js';
import { useEffect, useState } from 'react';

import { DashboardLayout } from '../../layouts/DashboardLayout.jsx';

function ModeCard({ mode, title, description, badge, icon, gradient, to }) {
  const navigate = useNavigate();
  return (
    <div
      className="mode-card"
      style={{ '--card-gradient': gradient }}
      onClick={() => navigate(to)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(to)}
    >
      <div className="mode-card__badge">{badge}</div>
      <div className="mode-card__icon">{icon}</div>
      <h2 className="mode-card__title">{title}</h2>
      <p className="mode-card__description">{description}</p>
      <div className="mode-card__cta">
        <span>Start {mode} Interview</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

function DashboardPage() {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    profileService.getMyProfile().then(res => {
      if (res.profile) setProfile(res.profile);
    }).catch(() => {});

    interviewService.getMySessions().then(res => {
      if (res.success && res.sessions) setSessions(res.sessions);
    }).catch(() => {});
  }, []);

  const stats = profile?.stats || { interviewsCompleted: 0, currentStreak: 0, averageReadiness: 0 };
  const weaknesses = profile?.weaknesses || [];
  const learningPath = profile?.learningPath || [];

  return (
    <>
      <style>{`
        .mode-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-top: 1.5rem;
        }

        .mode-card {
          position: relative;
          overflow: hidden;
          border-radius: 1.25rem;
          border: 1px solid var(--theme-border);
          background: var(--theme-surface);
          padding: 2rem;
          cursor: pointer;
          transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
          outline: none;
        }

        .mode-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--card-gradient);
          opacity: 0;
          transition: opacity 300ms ease;
          border-radius: inherit;
          pointer-events: none;
        }

        .mode-card:hover::before,
        .mode-card:focus::before {
          opacity: 1;
        }

        .mode-card:hover,
        .mode-card:focus {
          transform: translateY(-5px);
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12);
          border-color: transparent;
        }

        .mode-card__badge {
          display: inline-block;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0.25rem 0.75rem;
          border-radius: 99px;
          background: var(--theme-surface-alt);
          color: var(--theme-muted-text);
          margin-bottom: 1.25rem;
          position: relative;
          z-index: 1;
        }

        .mode-card__icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          position: relative;
          z-index: 1;
          line-height: 1;
        }

        .mode-card__title {
          font-size: 1.375rem;
          font-weight: 700;
          color: var(--theme-text);
          margin-bottom: 0.625rem;
          position: relative;
          z-index: 1;
        }

        .mode-card__description {
          font-size: 0.875rem;
          color: var(--theme-secondary-text);
          line-height: 1.65;
          margin-bottom: 1.75rem;
          position: relative;
          z-index: 1;
        }

        .mode-card__cta {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--theme-primary);
          position: relative;
          z-index: 1;
          transition: gap 180ms ease;
        }

        .mode-card:hover .mode-card__cta {
          gap: 0.75rem;
        }

        .mode-card--learning:hover .mode-card__title,
        .mode-card--learning:focus .mode-card__title {
          color: #2563eb;
        }

        .mode-card--placement:hover .mode-card__title,
        .mode-card--placement:focus .mode-card__title {
          color: #7c3aed;
        }

        .mode-card--placement .mode-card__cta {
          color: #7c3aed;
        }

        .mode-card--placement:hover,
        .mode-card--placement:focus {
          border-color: transparent;
        }
      `}</style>
      <DashboardLayout>

          {/* Welcome header */}
          <section className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-sm">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase text-[var(--theme-primary)]">Welcome back</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--theme-text)]">
                  {user?.name || 'AscendIQ User'}
                </h1>
                <p className="mt-2 text-sm text-[var(--theme-secondary-text)]">
                  Choose an interview mode to begin your preparation session.
                </p>
              </div>
              <Link to="/profile">
                <button className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-alt)] px-4 py-2 text-sm font-semibold text-[var(--theme-secondary-text)] transition hover:border-[var(--theme-primary)] hover:text-[var(--theme-primary)]">
                  Complete Profile
                </button>
              </Link>
            </div>
          </section>

          {/* Mode selector */}
          <section>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--theme-muted-text)]">Choose Mode</p>
                <h2 className="mt-1 text-xl font-semibold text-[var(--theme-text)]">Start an Interview</h2>
              </div>
            </div>

            <div className="mode-section">
              <ModeCard
                mode="Learning"
                title="Learning Mode"
                badge="📚 Concept Practice"
                description="Practice specific concepts and strengthen weak areas through AI-powered mock interviews tailored to your chosen topic."
                icon="🧠"
                gradient="linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(147,197,253,0.10) 100%)"
                to="/interview/learning"
              />
              <ModeCard
                mode="Placement"
                title="Placement Mode"
                badge="🏢 Company Prep"
                description="Prepare for company-specific interview rounds and placement processes with real-world interview simulations."
                icon="🎯"
                gradient="linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(196,181,253,0.10) 100%)"
                to="/interview/placement"
              />
            </div>
          </section>

          {/* Stats row */}
          <section className="grid gap-4 md:grid-cols-4">
            <Card title="Interviews Completed" value={stats.interviewsCompleted.toString()} description={stats.interviewsCompleted ? "Keep up the momentum." : "No interviews completed yet."} icon="📊" />
            <Card title="Current Streak" value={stats.currentStreak.toString()} description={stats.currentStreak ? "Consecutive interview goals." : "Start your first interview to begin a streak."} icon="🔥" />
            <Card title="Readiness Score" value={`${stats.averageReadiness}%`} description={stats.interviewsCompleted ? "Based on past AI evaluations." : "Complete interviews to calculate readiness."} icon="🎯" />
            <Card title="Weak Areas" value={weaknesses.length.toString()} description={weaknesses.length ? "Identified across sessions." : "No weaknesses detected yet."} icon="🔍" />
          </section>

          {/* Analytics + Weakness */}
          <section className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
            <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase text-[var(--theme-muted-text)]">Analytics</p>
                  <h2 className="mt-2 text-xl font-semibold text-[var(--theme-text)]">Readiness trend</h2>
                </div>
                <span className="rounded-lg bg-[var(--theme-surface-alt)] px-3 py-2 text-sm font-semibold text-[var(--theme-secondary-text)]">
                  {stats.averageReadiness}%
                </span>
              </div>
              <div className="mt-6">
                {stats.interviewsCompleted > 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--theme-surface-alt)', borderRadius: '1rem' }}>
                    <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--theme-primary)' }}>{stats.averageReadiness}%</p>
                    <p style={{ color: 'var(--theme-secondary-text)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Average Readiness Score</p>
                  </div>
                ) : (
                  <EmptyState
                    title="No analytics yet"
                    description="Start your first interview to see readiness trends, scoring patterns, and improvement signals."
                  />
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase text-[var(--theme-muted-text)]">Weakness Tracker</p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--theme-text)]">Focus areas</h2>
              <div className="mt-6">
                {weaknesses.length > 0 ? (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {weaknesses.slice(0, 5).map((w, i) => (
                      <li key={i} style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--theme-text)' }}>
                        ⚠️ {w}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    title="No weak topics yet"
                    description="Weak topics will appear only after AscendIQ evaluates real interview attempts."
                  />
                )}
              </div>
            </div>
          </section>

          {/* Interview History + Learning Path */}
          <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-[var(--theme-text)]">Interview History</h2>
              <div className="mt-5">
                {sessions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {sessions.slice(0, 5).map(session => (
                      <div 
                        key={session._id} 
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--theme-surface-alt)', borderRadius: '0.75rem', cursor: 'pointer', transition: 'transform 0.1s' }} 
                        onClick={() => navigate(`/interview/summary/${session._id}`)}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, color: 'var(--theme-text)' }}>
                            {session.mode === 'learning' ? session.topic : `${session.company} - ${session.role}`}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--theme-secondary-text)', marginTop: '0.25rem' }}>
                            {new Date(session.createdAt).toLocaleDateString()} • {session.duration || 15} mins • {session.status}
                          </p>
                        </div>
                        {session.status === 'completed' && (
                          <div style={{ padding: '0.35rem 0.8rem', background: 'rgba(37,99,235,0.1)', color: '#2563eb', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            {session.readiness?.overallScore || 0}% Score
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No interviews completed yet"
                    description="Your completed interview sessions, scores, and review links will appear here."
                  />
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-[var(--theme-text)]">Learning Path</h2>
              <div className="mt-5">
                {learningPath.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {learningPath.map((step, i) => (
                      <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1rem', background: 'var(--theme-surface-alt)', borderRadius: '0.75rem' }}>
                        <div style={{ background: 'var(--theme-primary)', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
                          {i + 1}
                        </div>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--theme-text)' }}>{step}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No learning path yet"
                    description="Complete an interview so AscendIQ can generate a path from real performance data."
                  />
                )}
              </div>
            </div>
          </section>
      </DashboardLayout>
    </>
  );
}

export default DashboardPage;
