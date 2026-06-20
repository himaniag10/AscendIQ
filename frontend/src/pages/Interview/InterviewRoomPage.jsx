import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { interviewService } from '../../services/interview.service.js';

function InterviewRoomPage() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [session, setSession] = useState(location.state?.session || null);
  const [question, setQuestion] = useState(location.state?.firstQuestion || '');
  const [loading, setLoading] = useState(!session || !question);
  const [error, setError] = useState('');

  const [time, setTime] = useState(0);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);

  // Fetch session data if not available in location state (e.g., page refresh)
  useEffect(() => {
    if (!session || !question) {
      setLoading(true);
      interviewService.getSession(sessionId)
        .then((data) => {
          setSession(data.session);
          setQuestion(data.session.firstQuestion);
        })
        .catch((err) => {
          setError(err?.response?.data?.message || err.message || 'Session not found.');
        })
        .finally(() => setLoading(false));
    }
  }, [sessionId, session, question]);

  // Handle active video/audio stream capture
  useEffect(() => {
    let activeStream = null;

    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        activeStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error('Error starting video stream:', err);
        setError('Could not access camera or microphone. Please check permissions.');
      }
    };

    if (!loading) {
      startCamera();
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [loading]);

  // Live timer interval
  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndInterview = async () => {
    try {
      await interviewService.updateSessionStatus(sessionId, 'completed');
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to end interview:', err);
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Connecting to mock interview room…</p>
        <style>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: calc(100vh - 4rem);
            background: var(--theme-background);
            color: var(--theme-secondary-text);
            gap: 1rem;
          }
          .spinner {
            width: 36px;
            height: 36px;
            border: 3px solid var(--theme-border);
            border-top-color: var(--theme-primary);
            border-radius: 50%;
            animation: spin 700ms linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="error-container">
        <p>⚠️ {error || 'Failed to load interview session.'}</p>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        <style>{`
          .error-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: calc(100vh - 4rem);
            background: var(--theme-background);
            color: var(--theme-secondary-text);
            gap: 1.5rem;
          }
          .error-container button {
            padding: 0.625rem 1.5rem;
            border-radius: 0.5rem;
            border: 1px solid var(--theme-border);
            background: var(--theme-surface);
            color: var(--theme-text);
            font-weight: 500;
            cursor: pointer;
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .room-layout {
          display: grid;
          grid-template-rows: auto 1fr auto;
          min-height: calc(100vh - 4rem);
          background: var(--theme-background);
          color: var(--theme-text);
        }

        .room-header {
          padding: 1rem 2rem;
          border-bottom: 1px solid var(--theme-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--theme-surface);
        }

        .header-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .room-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
          color: var(--theme-text);
        }

        .role-sub {
          font-size: 0.875rem;
          color: var(--theme-secondary-text);
          font-weight: 500;
        }

        .mode-badge {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.25rem 0.625rem;
          border-radius: 99px;
        }

        .mode-badge--learning {
          background: rgba(37, 99, 235, 0.1);
          color: #2563eb;
          border: 1px solid rgba(37, 99, 235, 0.15);
        }

        .mode-badge--placement {
          background: rgba(124, 58, 237, 0.1);
          color: #7c3aed;
          border: 1px solid rgba(124, 58, 237, 0.15);
        }

        .timer-wrap {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--theme-surface-alt);
          border: 1px solid var(--theme-border);
          padding: 0.375rem 0.875rem;
          border-radius: 0.5rem;
        }

        .timer-dot {
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          animation: blink 1.2s infinite;
        }

        @keyframes blink {
          0% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.3; }
        }

        .timer-val {
          font-family: monospace;
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--theme-text);
        }

        .room-main {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 1.75rem;
          padding: 1.75rem 2rem;
          align-items: start;
        }

        @media (max-width: 900px) {
          .room-main {
            grid-template-columns: 1fr;
          }
        }

        .camera-panel {
          position: sticky;
          top: 1.5rem;
        }

        .video-container {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 3;
          border-radius: 1rem;
          overflow: hidden;
          background: #000;
          border: 1px solid var(--theme-border);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .video-feed {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .video-overlay {
          position: absolute;
          top: 0.75rem;
          left: 0.75rem;
          pointer-events: none;
        }

        .live-pill {
          background: rgba(239, 68, 68, 0.9);
          color: white;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
          letter-spacing: 0.05em;
        }

        .content-panel {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .question-card {
          background: var(--theme-surface);
          border: 1px solid var(--theme-border);
          border-radius: 1.25rem;
          padding: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
        }

        .question-card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }

        .ai-avatar {
          font-size: 1.5rem;
          background: var(--theme-surface-alt);
          padding: 0.5rem;
          border-radius: 50%;
          border: 1px solid var(--theme-border);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ai-author {
          font-size: 0.95rem;
          font-weight: 700;
          margin: 0;
          color: var(--theme-text);
        }

        .ai-status {
          font-size: 0.75rem;
          color: var(--theme-muted-text);
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .ai-status::after {
          content: '';
          display: inline-block;
          width: 6px;
          height: 6px;
          background: #22c55e;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }

        .question-content {
          font-size: 1.1rem;
          line-height: 1.6;
          font-weight: 500;
          color: var(--theme-text);
          white-space: pre-line;
        }

        .chat-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 3.5rem 2rem;
          background: var(--theme-surface-alt);
          border: 1.5px dashed var(--theme-border);
          border-radius: 1.25rem;
          min-height: 250px;
        }

        .mic-pulse {
          position: relative;
          width: 52px;
          height: 52px;
          background: var(--theme-surface);
          border: 1px solid var(--theme-border);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          margin-bottom: 1.25rem;
        }

        .pulse-circle {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 1.5px solid var(--theme-primary);
          opacity: 0;
          animation: rip 2s infinite;
        }

        @keyframes rip {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(1.6); opacity: 0; }
        }

        .placeholder-text {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--theme-secondary-text);
          margin-bottom: 0.375rem;
        }

        .placeholder-sub {
          font-size: 0.8125rem;
          color: var(--theme-muted-text);
          max-width: 340px;
          line-height: 1.5;
        }

        .room-footer {
          padding: 1.25rem 2rem;
          border-top: 1px solid var(--theme-border);
          background: var(--theme-surface);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .mic-status-wrap {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--theme-border);
        }

        .status-indicator--active {
          background: #22c55e;
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.4);
        }

        .status-text {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--theme-secondary-text);
        }

        .end-btn {
          padding: 0.625rem 1.5rem;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
          background: #ef4444;
          border: none;
          cursor: pointer;
          transition: opacity 160ms ease, transform 100ms ease;
        }

        .end-btn:hover {
          opacity: 0.9;
        }

        .end-btn:active {
          transform: scale(0.98);
        }
      `}</style>

      <div className="room-layout">
        {/* Top Section */}
        <header className="room-header">
          <div className="header-meta">
            <span className={`mode-badge mode-badge--${session.mode}`}>
              {session.mode === 'learning' ? '🧠 Learning Mode' : '🏢 Placement Mode'}
            </span>
            <h1 className="room-title">
              {session.mode === 'learning' ? session.topic : session.company}
            </h1>
            {session.role && <span className="role-sub"> • {session.role}</span>}
            {session.mode === 'learning' && session.difficulty && <span className="role-sub"> • {session.difficulty}</span>}
          </div>

          <div className="timer-wrap">
            <span className="timer-dot" />
            <span className="timer-val">{formatTime(time)}</span>
          </div>
        </header>

        {/* Mid Section */}
        <main className="room-main">
          {/* Left Panel: Camera Feed */}
          <aside className="camera-panel">
            <div className="video-container">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="video-feed"
              />
              <div className="video-overlay">
                <span className="live-pill">● LIVE FEED</span>
              </div>
            </div>
          </aside>

          {/* Center Panel: Current AI Question + Placeholder Area */}
          <section className="content-panel">
            <div className="question-card">
              <div className="question-card-header">
                <span className="ai-avatar">🤖</span>
                <div>
                  <h3 className="ai-author">AscendIQ AI Interviewer</h3>
                  <div className="ai-status">speaking</div>
                </div>
              </div>
              <div className="question-content">
                {question}
              </div>
            </div>

            <div className="chat-placeholder">
              <div className="mic-pulse">
                <span className="pulse-circle" />
                🎙️
              </div>
              <p className="placeholder-text">Listening for your answer...</p>
              <p className="placeholder-sub">
                Speak clearly into your microphone. Once finished, click "End Interview" to complete this practice session.
              </p>
            </div>
          </section>
        </main>

        {/* Bottom Section */}
        <footer className="room-footer">
          <div className="mic-status-wrap">
            <span className="status-indicator status-indicator--active" />
            <span className="status-text">🎙️ Microphone: Connected</span>
          </div>

          <button className="end-btn" onClick={handleEndInterview}>
            End Interview
          </button>
        </footer>
      </div>
    </>
  );
}

export default InterviewRoomPage;
