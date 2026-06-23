import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../layouts/DashboardLayout.jsx';
import { interviewService } from '../../services/interview.service.js';
import { Button } from '../../components/ui/Button.jsx';

export default function TranscriptPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      interviewService.getSession(sessionId),
      interviewService.getMessages(sessionId)
    ]).then(([sessionRes, msgRes]) => {
      if (sessionRes.success) setSession(sessionRes.session);
      if (msgRes.success) setMessages(msgRes.messages);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [sessionId]);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--theme-text)]">Interview Transcript</h1>
          <p className="text-sm text-[var(--theme-secondary-text)]">
            {session ? (session.mode === 'learning' ? session.topic : `${session.company} - ${session.role}`) : 'Loading...'}
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/interviews')}>
          Back to History
        </Button>
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-sm">
        {loading ? (
          <p className="text-[var(--theme-secondary-text)]">Loading transcript...</p>
        ) : messages.length > 0 ? (
          <div className="space-y-6">
            {messages.map((msg, idx) => (
              <div key={msg._id || idx} className={`flex ${msg.role === 'candidate' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-4 ${
                  msg.role === 'candidate' 
                    ? 'bg-[var(--theme-primary)] text-white rounded-br-none' 
                    : 'bg-[var(--theme-surface-alt)] text-[var(--theme-text)] border border-[var(--theme-border)] rounded-bl-none'
                }`}>
                  <p className="text-sm font-semibold mb-1 opacity-80">
                    {msg.role === 'candidate' ? 'You' : 'AI Interviewer'}
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[var(--theme-secondary-text)]">No transcript available for this session.</p>
        )}
      </div>
    </DashboardLayout>
  );
}
