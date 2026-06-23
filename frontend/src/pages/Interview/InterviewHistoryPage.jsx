import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../layouts/DashboardLayout.jsx';
import { interviewService } from '../../services/interview.service.js';
import { Button } from '../../components/ui/Button.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';

export default function InterviewHistoryPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    interviewService.getMySessions().then(res => {
      if (res.success && res.sessions) setSessions(res.sessions);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--theme-text)]">Interview History</h1>
          <p className="text-sm text-[var(--theme-secondary-text)]">Review your past interviews, transcripts, and analysis</p>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <p className="text-[var(--theme-secondary-text)]">Loading history...</p>
        ) : sessions.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map(session => (
              <div key={session._id} className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold uppercase ${
                      session.mode === 'learning' ? 'bg-blue-500/10 text-blue-600' : 'bg-purple-500/10 text-purple-600'
                    }`}>
                      {session.mode}
                    </span>
                    <h3 className="mt-2 font-semibold text-[var(--theme-text)]">
                      {session.mode === 'learning' ? session.topic : `${session.company} - ${session.role}`}
                    </h3>
                  </div>
                  <div className="text-right">
                    {session.status === 'completed' && (
                      <span className="text-xl font-bold text-[var(--theme-primary)]">
                        {session.readiness?.overallScore || 0}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-1 text-sm text-[var(--theme-secondary-text)]">
                  <p>Date: {new Date(session.createdAt).toLocaleDateString()}</p>
                  <p>Duration: {session.duration || 15} mins</p>
                  <p>Status: <span className="capitalize">{session.status}</span></p>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {session.status === 'completed' && (
                    <>
                      <Button variant="secondary" onClick={() => navigate(`/interview/summary/${session._id}`)}>
                        View Analysis
                      </Button>
                      <Button variant="secondary" onClick={() => navigate(`/interview/transcript/${session._id}`)}>
                        Transcript
                      </Button>
                    </>
                  )}
                  {session.status === 'scheduled' && (
                    <Button onClick={() => navigate(`/interview/${session._id}`)}>
                      Resume
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No history yet"
            description="Start your first interview to build a track record."
            action={<Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
