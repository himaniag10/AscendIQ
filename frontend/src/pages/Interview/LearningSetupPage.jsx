import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewService } from '../../services/interview.service.js';

const PRESET_TOPICS = [
  'Arrays', 'Linked Lists', 'Stacks', 'Queues', 'Trees', 'Graphs',
  'DBMS', 'Operating Systems', 'Computer Networks', 'OOP',
  'JavaScript', 'React', 'Node.js', 'System Design', 'HR Interview',
];

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];
const DURATIONS = [5, 10, 15, 20, 'Custom'];

function ChipGroup({ options, selected, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onSelect(opt)}
          className={`chip ${selected === opt ? 'chip--active' : ''}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function LearningSetupPage() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [duration, setDuration] = useState(15);
  const [customDuration, setCustomDuration] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const effectiveTopic = topic || customTopic.trim();

  const handleTopicChip = (t) => {
    setTopic(t);
    setCustomTopic('');
  };

  const handleCustomTopicChange = (e) => {
    setCustomTopic(e.target.value);
    setTopic('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!effectiveTopic) {
      setError('Please select or enter a topic.');
      return;
    }
    if (!difficulty) {
      setError('Please select a difficulty level.');
      return;
    }

    let effectiveDuration = duration;
    if (duration === 'Custom') {
      const parsed = parseInt(customDuration, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 120) {
        setError('Please enter a valid custom duration between 1 and 120 minutes.');
        return;
      }
      effectiveDuration = parsed;
    }

    setSubmitting(true);
    try {
      const data = await interviewService.createSession({
        mode: 'learning',
        topic: effectiveTopic,
        difficulty,
        duration: effectiveDuration,
      });
      navigate(`/interview/summary/${data.session._id}`);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to create session.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        .setup-page {
          min-height: calc(100vh - 4rem);
          background: var(--theme-background);
          padding: 3rem 1rem;
        }

        .setup-container {
          max-width: 760px;
          margin: 0 auto;
        }

        .setup-header {
          margin-bottom: 2rem;
        }

        .setup-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0.3rem 0.875rem;
          border-radius: 99px;
          background: rgba(37, 99, 235, 0.10);
          color: #2563eb;
          margin-bottom: 0.875rem;
        }

        .setup-title {
          font-size: 2rem;
          font-weight: 700;
          color: var(--theme-text);
          letter-spacing: -0.02em;
          margin-bottom: 0.5rem;
        }

        .setup-subtitle {
          font-size: 0.9375rem;
          color: var(--theme-secondary-text);
        }

        .setup-card {
          background: var(--theme-surface);
          border: 1px solid var(--theme-border);
          border-radius: 1.25rem;
          padding: 1.75rem;
          margin-bottom: 1.25rem;
          box-shadow: 0 2px 12px rgba(15, 23, 42, 0.05);
        }

        .setup-card__label {
          font-size: 0.8125rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--theme-muted-text);
          margin-bottom: 0.875rem;
        }

        .chip {
          padding: 0.4375rem 0.875rem;
          border-radius: 0.5rem;
          border: 1px solid var(--theme-border);
          background: var(--theme-surface-alt);
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--theme-secondary-text);
          cursor: pointer;
          transition: all 160ms ease;
        }

        .chip:hover {
          border-color: #93c5fd;
          color: #2563eb;
          background: rgba(37, 99, 235, 0.06);
        }

        .chip--active {
          border-color: #2563eb;
          background: rgba(37, 99, 235, 0.10);
          color: #2563eb;
          font-weight: 600;
        }

        .segmented {
          display: flex;
          background: var(--theme-surface-alt);
          border-radius: 0.75rem;
          padding: 0.25rem;
          gap: 0.25rem;
        }

        .segmented__btn {
          flex: 1;
          padding: 0.625rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--theme-secondary-text);
          cursor: pointer;
          border: none;
          background: transparent;
          transition: all 180ms ease;
          text-align: center;
        }

        .segmented__btn--active {
          background: var(--theme-surface);
          color: #2563eb;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
        }

        .custom-input {
          width: 100%;
          margin-top: 0.875rem;
          padding: 0.625rem 0.875rem;
          border-radius: 0.625rem;
          border: 1px solid var(--theme-border);
          background: var(--theme-surface);
          font-size: 0.875rem;
          color: var(--theme-text);
          outline: none;
          transition: border-color 160ms ease, box-shadow 160ms ease;
        }

        .custom-input::placeholder {
          color: var(--theme-muted-text);
        }

        .custom-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }

        .voice-banner {
          display: flex;
          align-items: flex-start;
          gap: 0.875rem;
          padding: 1rem 1.25rem;
          border-radius: 0.875rem;
          background: linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(147,197,253,0.10) 100%);
          border: 1px solid rgba(37, 99, 235, 0.18);
          margin-bottom: 1.25rem;
        }

        .voice-banner__icon {
          font-size: 1.25rem;
          flex-shrink: 0;
          margin-top: 0.1rem;
        }

        .voice-banner__text {
          font-size: 0.8125rem;
          color: var(--theme-secondary-text);
          line-height: 1.6;
        }

        .voice-banner__text strong {
          color: var(--theme-text);
        }

        .submit-btn {
          width: 100%;
          padding: 0.875rem;
          border-radius: 0.875rem;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: opacity 200ms ease, transform 180ms ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .submit-btn:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
        }

        .submit-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .error-msg {
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #ef4444;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 1rem;
        }

        .back-btn {
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
          margin-bottom: 1.5rem;
          transition: color 160ms ease;
        }

        .back-btn:hover {
          color: var(--theme-text);
        }
      `}</style>

      <div className="setup-page">
        <div className="setup-container">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Dashboard
          </button>

          <div className="setup-header">
            <div className="setup-badge">🧠 Learning Mode</div>
            <h1 className="setup-title">Set Up Your Learning Interview</h1>
            <p className="setup-subtitle">Select a topic and difficulty level to begin your AI-powered practice session.</p>
          </div>

          <div className="voice-banner">
            <span className="voice-banner__icon">🎙️</span>
            <p className="voice-banner__text">
              <strong>Voice & Camera Interview:</strong> AI interviews use voice interaction and camera monitoring to simulate a real interview experience. Ensure your microphone and camera are ready before starting.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Topic Selection */}
            <div className="setup-card">
              <p className="setup-card__label">Select Topic</p>
              <ChipGroup options={PRESET_TOPICS} selected={topic} onSelect={handleTopicChip} />
              <input
                type="text"
                className="custom-input"
                placeholder="Or enter a custom topic (e.g. Redis, Next.js, Machine Learning…)"
                value={customTopic}
                onChange={handleCustomTopicChange}
              />
            </div>

            {/* Difficulty */}
            <div className="setup-card">
              <p className="setup-card__label">Difficulty Level</p>
              <div className="segmented">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`segmented__btn ${difficulty === d ? 'segmented__btn--active' : ''}`}
                    onClick={() => setDifficulty(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="setup-card">
              <p className="setup-card__label">Interview Duration</p>
              <div className="segmented">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`segmented__btn ${duration === d ? 'segmented__btn--active' : ''}`}
                    onClick={() => setDuration(d)}
                  >
                    {d} {d !== 'Custom' && 'min'}
                  </button>
                ))}
              </div>
              {duration === 'Custom' && (
                <input
                  type="number"
                  min="1"
                  max="120"
                  className="custom-input"
                  placeholder="Enter duration in minutes (e.g. 25)"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                />
              )}
            </div>

            {error && <div className="error-msg">{error}</div>}

            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? (
                'Creating session…'
              ) : (
                <>
                  Continue to Summary
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default LearningSetupPage;
