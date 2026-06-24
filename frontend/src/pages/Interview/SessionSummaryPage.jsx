import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { interviewService } from '../../services/interview.service.js';
import { DashboardLayout } from '../../layouts/DashboardLayout.jsx';

const MODE_META = {
  learning: {
    label: 'Learning Mode',
    badge: '🧠 Learning Mode',
    accent: '#2563eb',
    softBg: 'rgba(37,99,235,0.06)',
    softBorder: 'rgba(37,99,235,0.18)',
  },
  placement: {
    label: 'Placement Mode',
    badge: '🏢 Placement Mode',
    accent: '#7c3aed',
    softBg: 'rgba(124,58,237,0.06)',
    softBorder: 'rgba(124,58,237,0.18)',
  },
};

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="summary-row">
      <span className="summary-row__label">{label}</span>
      <span className="summary-row__value">{value}</span>
    </div>
  );
}

function SessionSummaryPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [cameraStatus, setCameraStatus] = useState('checking');
  const [micStatus, setMicStatus] = useState('checking');
  const [envStatus, setEnvStatus] = useState('checking');
  const [startError, setStartError] = useState('');
  const [starting, setStarting] = useState(false);
  
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

  const requestPermissions = async () => {
    setCameraStatus('checking');
    setMicStatus('checking');
    setEnvStatus('checking');
    setStartError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setCameraStatus('granted');
      setMicStatus('granted');
      setEnvStatus(navigator.onLine ? 'ready' : 'unsupported');
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error('Error requesting permissions:', err);
      await checkIndividualPermissions();
    }
  };

  const checkIndividualPermissions = async () => {
    let hasVideo = false;
    let hasAudio = false;

    try {
      const vStream = await navigator.mediaDevices.getUserMedia({ video: true });
      hasVideo = true;
      vStream.getTracks().forEach(t => t.stop());
      setCameraStatus('granted');
    } catch (e) {
      setCameraStatus('denied');
    }

    try {
      const aStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      hasAudio = true;
      aStream.getTracks().forEach(t => t.stop());
      setMicStatus('granted');
    } catch (e) {
      setMicStatus('denied');
    }

    setEnvStatus(navigator.onLine && (hasVideo || hasAudio) ? 'ready' : 'unsupported');
  };

  useEffect(() => {
    if (session) {
      requestPermissions();
    }
  }, [session]);

  const handleStartInterview = async () => {
    setStarting(true);
    setStartError('');
    try {
      const data = await interviewService.startInterview({ sessionId });
      if (data.success) {
        navigate(`/interview/${data.sessionId}`, {
          state: {
            firstQuestion: data.firstQuestion,
            session
          }
        });
      } else {
        setStartError(data.message || 'Failed to start interview.');
      }
    } catch (err) {
      setStartError(err?.response?.data?.message || err.message || 'Failed to start interview.');
    } finally {
      setStarting(false);
    }
  };

  const hasTriggeredAnalysis = React.useRef(false);

  useEffect(() => {
    interviewService.getSession(sessionId)
      .then((data) => {
        setSession(data.session);
        if (data.session.status === 'completed' && (!data.session.readiness || data.session.readiness.overallScore === 0) && !data.session.analysisCompleted) {
          if (!hasTriggeredAnalysis.current) {
            hasTriggeredAnalysis.current = true;
            triggerAnalysis(data.session._id);
          }
        }
      })
      .catch((err) => setError(err?.response?.data?.message || err.message || 'Session not found.'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const triggerAnalysis = async (id) => {
    setAnalyzing(true);
    setAnalysisError('');
    console.log('ANALYZE_TRIGGERED_FROM: useEffect');
    try {
      const data = await interviewService.analyzeInterview(id);
      if (data.success) {
        setSession(data.session);
      }
    } catch (err) {
      if (err?.response?.status === 409 || err?.response?.status >= 500) {
        // Fallback: If 409 (locked) or 500 (failed analysis), double check if analysis succeeded in DB
        try {
          const check = await interviewService.getSession(id);
          if (check.session.analysisCompleted || (check.session.readiness && check.session.readiness.overallScore > 0)) {
            setSession(check.session);
            return;
          }
        } catch (_) {}
      }
      setAnalysisError(err?.response?.data?.message || 'Analysis unavailable.\nAI provider failed to evaluate this interview.');
    } finally {
      setAnalyzing(false);
    }
  };

  const meta = session ? (MODE_META[session.mode] || MODE_META.learning) : null;

  if (loading) {
    return (
      <div className="summary-loading">
        <div className="summary-spinner" />
        <p>Loading session…</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="summary-error-wrap">
        <div className="summary-error">
          <p>⚠️ {error || 'Session not found.'}</p>
          <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <style>{`
        .summary-page {
          background: transparent;
        }

        .summary-container {
          max-width: 600px;
          margin: 0 auto;
        }

        .summary-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--theme-muted-text);
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          margin-bottom: 1.75rem;
          transition: color 160ms ease;
        }

        .summary-back-btn:hover { color: var(--theme-text); }

        .summary-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0.3rem 0.875rem;
          border-radius: 99px;
          margin-bottom: 0.875rem;
        }

        .summary-title {
          font-size: 1.875rem;
          font-weight: 700;
          color: var(--theme-text);
          letter-spacing: -0.02em;
          margin-bottom: 0.375rem;
        }

        .summary-subtitle {
          font-size: 0.9rem;
          color: var(--theme-secondary-text);
          margin-bottom: 2rem;
        }

        .summary-card {
          background: var(--theme-surface);
          border: 1px solid var(--theme-border);
          border-radius: 1.25rem;
          padding: 1.75rem;
          margin-bottom: 1.25rem;
          box-shadow: 0 2px 12px rgba(15, 23, 42, 0.05);
        }

        .summary-card__heading {
          font-size: 0.8125rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--theme-muted-text);
          margin-bottom: 1.125rem;
        }

        .summary-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.625rem 0;
          border-bottom: 1px solid var(--theme-border);
        }

        .summary-row:last-child { border-bottom: none; }

        .summary-row__label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--theme-secondary-text);
          flex-shrink: 0;
        }

        .summary-row__value {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--theme-text);
          text-align: right;
        }

        .camera-card {
          background: var(--theme-surface);
          border: 1px solid var(--theme-border);
          border-radius: 1.25rem;
          padding: 1.75rem;
          margin-bottom: 1.25rem;
        }

        .camera-card__heading {
          font-size: 0.8125rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--theme-muted-text);
          margin-bottom: 1rem;
        }

        .permission-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.875rem 1rem;
          border-radius: 0.75rem;
          background: var(--theme-surface-alt);
          margin-bottom: 0.625rem;
        }

        .permission-row:last-child { margin-bottom: 0; }

        .permission-row__left {
          display: flex;
          align-items: center;
          gap: 0.625rem;
        }

        .permission-row__icon { font-size: 1.125rem; }

        .permission-row__label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--theme-text);
        }

        .permission-row__sub {
          font-size: 0.75rem;
          color: var(--theme-muted-text);
        }

        .permission-badge {
          font-size: 0.7rem;
          font-weight: 600;
          padding: 0.2rem 0.6rem;
          border-radius: 99px;
          background: var(--theme-border);
          color: var(--theme-secondary-text);
          letter-spacing: 0.05em;
        }

        .permission-badge--success {
          background: rgba(34, 197, 94, 0.1) !important;
          color: #22c55e !important;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .permission-badge--danger {
          background: rgba(239, 68, 68, 0.1) !important;
          color: #ef4444 !important;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .start-btn {
          width: 100%;
          padding: 0.9375rem;
          border-radius: 0.875rem;
          font-size: 1rem;
          font-weight: 600;
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          transition: opacity 160ms ease, transform 160ms ease;
        }

        .coming-soon-note {
          text-align: center;
          font-size: 0.8125rem;
          color: var(--theme-muted-text);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.375rem;
        }

        .coming-soon-pill {
          display: inline-block;
          padding: 0.2rem 0.625rem;
          border-radius: 99px;
          background: var(--theme-surface-alt);
          border: 1px solid var(--theme-border);
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: var(--theme-muted-text);
        }

        .summary-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 40vh;
          gap: 1rem;
          color: var(--theme-secondary-text);
          font-size: 0.9rem;
        }

        .summary-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--theme-border);
          border-top-color: var(--theme-primary);
          border-radius: 50%;
          animation: spin 700ms linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .summary-error-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 40vh;
          padding: 1rem;
        }

        .summary-error {
          text-align: center;
          color: var(--theme-secondary-text);
        }

        .summary-error button {
          margin-top: 1rem;
          padding: 0.5rem 1.25rem;
          border-radius: 0.625rem;
          border: 1px solid var(--theme-border);
          background: var(--theme-surface);
          color: var(--theme-text);
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .results-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .score-card {
          background: var(--theme-surface);
          border: 1px solid var(--theme-border);
          border-radius: 1.25rem;
          padding: 1.5rem;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        }

        .score-card__circle {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          border: 6px solid var(--theme-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--theme-text);
          background: var(--theme-surface-alt);
        }

        .score-card__label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--theme-muted-text);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .feedback-section {
          background: var(--theme-surface);
          border: 1px solid var(--theme-border);
          border-radius: 1.25rem;
          padding: 1.5rem;
          margin-bottom: 1.25rem;
        }
        
        .feedback-section h3 {
          font-size: 1.125rem;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .feedback-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .feedback-list li {
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          background: var(--theme-surface-alt);
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          color: var(--theme-secondary-text);
        }
      `}</style>

      <div className="summary-page">
        <div className="summary-container">
          <button className="summary-back-btn" onClick={() => navigate('/dashboard')}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Dashboard
          </button>

          <div
            className="summary-badge"
            style={{ background: `${meta.softBg}`, border: `1px solid ${meta.softBorder}`, color: meta.accent }}
          >
            {meta.badge}
          </div>
          
          <h1 className="summary-title">
            {session.status === 'completed' ? 'Interview Results' : 'Interview Summary'}
          </h1>
          <p className="summary-subtitle">
            {session.status === 'completed' 
              ? 'Review your performance and detailed AI feedback.'
              : 'Review your configuration before starting the interview.'}
          </p>

          {analyzing && (
            <div className="summary-loading" style={{ minHeight: '30vh' }}>
              <div className="summary-spinner" />
              <p>Analyzing transcript and generating feedback... This may take a few seconds.</p>
            </div>
          )}

          {analysisError && (
            <div className="error-msg" style={{ marginBottom: '1.5rem', whiteSpace: 'pre-wrap' }}>⚠️ {analysisError}</div>
          )}

          {session.status === 'completed' && !analyzing && session.readiness && session.readiness.overallScore > 0 && (
            <>
              <div className="results-grid">
                <div className="score-card">
                  <div className="score-card__circle" style={{ borderColor: meta.accent }}>
                    {session.readiness.overallScore}%
                  </div>
                  <p className="score-card__label">Overall Readiness</p>
                </div>
              </div>

              <div className="summary-card">
                <p className="summary-card__heading">Detailed Scores</p>
                <InfoRow label="Technical Accuracy" value={`${session.readiness.technicalAccuracy}%`} />
                <InfoRow label="Communication" value={`${session.readiness.communication}%`} />
                <InfoRow label="Confidence" value={`${session.readiness.confidence}%`} />
                <InfoRow label="Completeness" value={`${session.readiness.completeness}%`} />
              </div>

              {session.feedback && (
                <>
                  <div className="feedback-section" style={{ borderLeft: '4px solid #22c55e' }}>
                    <h3 style={{ color: '#22c55e' }}><span>💡</span> Key Strengths</h3>
                    <ul className="feedback-list">
                      {session.feedback.strengths.map((str, idx) => <li key={idx}>{str}</li>)}
                    </ul>
                  </div>

                  <div className="feedback-section" style={{ borderLeft: '4px solid #ef4444' }}>
                    <h3 style={{ color: '#ef4444' }}><span>⚠️</span> Weaknesses</h3>
                    <ul className="feedback-list">
                      {session.feedback.weaknesses.map((w, idx) => <li key={idx}>{w}</li>)}
                    </ul>
                  </div>

                  <div className="feedback-section" style={{ borderLeft: '4px solid #3b82f6' }}>
                    <h3 style={{ color: '#3b82f6' }}><span>📈</span> Areas for Improvement</h3>
                    <ul className="feedback-list">
                      {session.feedback.improvementAreas.map((imp, idx) => <li key={idx}>{imp}</li>)}
                    </ul>
                  </div>
                </>
              )}
            </>
          )}

          {/* Session details card (Always visible) */}
          <div className="summary-card">
            <p className="summary-card__heading">Session Configuration</p>

            <InfoRow label="Mode" value={meta.label} />

            {/* Learning mode fields */}
            {session.mode === 'learning' && (
              <>
                <InfoRow label="Topic" value={session.topic} />
                <InfoRow label="Difficulty" value={session.difficulty} />
              </>
            )}

            {/* Placement mode fields */}
            {session.mode === 'placement' && (
              <>
                <InfoRow label="Company" value={session.company} />
                <InfoRow label="Role" value={session.role} />
                <InfoRow label="Experience Level" value={session.experienceLevel} />
                <InfoRow label="Interview Round" value={session.round} />
              </>
            )}

            <InfoRow label="Duration" value={`${session.duration || 15} mins`} />
            <InfoRow label="Status" value={session.status.charAt(0).toUpperCase() + session.status.slice(1)} />
            <InfoRow
              label="Created"
              value={new Date(session.createdAt).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            />
          </div>

          {session.status !== 'completed' && (
            <>

          {/* Camera & Mic Preparation */}
          <div className="camera-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <p className="camera-card__heading" style={{ margin: 0 }}>🎙️ Interview Environment</p>
              {(cameraStatus === 'denied' || micStatus === 'denied') && (
                <button
                  onClick={requestPermissions}
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: meta.accent,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  🔄 Retry Access
                </button>
              )}
            </div>

            <div className="permission-row">
              <div className="permission-row__left">
                <span className="permission-row__icon">📷</span>
                <div>
                  <p className="permission-row__label">Camera Access</p>
                  <p className="permission-row__sub">Required for interview monitoring</p>
                </div>
              </div>
              {cameraStatus === 'checking' && <span className="permission-badge">Checking...</span>}
              {cameraStatus === 'granted' && <span className="permission-badge permission-badge--success">✅ Camera Connected</span>}
              {cameraStatus === 'denied' && <span className="permission-badge permission-badge--danger">❌ Permission Missing</span>}
            </div>

            <div className="permission-row">
              <div className="permission-row__left">
                <span className="permission-row__icon">🎤</span>
                <div>
                  <p className="permission-row__label">Microphone Access</p>
                  <p className="permission-row__sub">Required for voice answers</p>
                </div>
              </div>
              {micStatus === 'checking' && <span className="permission-badge">Checking...</span>}
              {micStatus === 'granted' && <span className="permission-badge permission-badge--success">✅ Microphone Connected</span>}
              {micStatus === 'denied' && <span className="permission-badge permission-badge--danger">❌ Permission Missing</span>}
            </div>

            <div className="permission-row">
              <div className="permission-row__left">
                <span className="permission-row__icon">🌐</span>
                <div>
                  <p className="permission-row__label">Environment Check</p>
                  <p className="permission-row__sub">Network & browser compatibility</p>
                </div>
              </div>
              {envStatus === 'checking' && <span className="permission-badge">Checking...</span>}
              {envStatus === 'ready' && <span className="permission-badge permission-badge--success">✅ Ready</span>}
              {envStatus === 'unsupported' && <span className="permission-badge permission-badge--danger">❌ Check Connection</span>}
            </div>
          </div>

          {/* Start Interview */}
          {startError && <div className="error-msg" style={{ marginTop: '1rem', marginBottom: '1rem' }}>⚠️ {startError}</div>}

          <button
            type="button"
            className="start-btn"
            disabled={starting || cameraStatus !== 'granted' || micStatus !== 'granted'}
            onClick={handleStartInterview}
            style={{
              background: `linear-gradient(135deg, ${meta.accent}, ${meta.accent}cc)`,
              cursor: (starting || cameraStatus !== 'granted' || micStatus !== 'granted') ? 'not-allowed' : 'pointer',
              opacity: (starting || cameraStatus !== 'granted' || micStatus !== 'granted') ? 0.45 : 1
            }}
          >
            {starting ? (
              <>
                Starting Mock Interview...
              </>
            ) : (
              <>
                <span>🚀</span>
                Start AI Interview
              </>
            )}
          </button>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default SessionSummaryPage;
