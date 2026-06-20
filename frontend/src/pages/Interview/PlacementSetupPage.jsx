import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewService } from '../../services/interview.service.js';

const PRESET_COMPANIES = [
  'Google', 'Microsoft', 'Amazon', 'Adobe', 'Atlassian',
  'Flipkart', 'TCS', 'Infosys',
];

const PRESET_ROLES = [
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Software Engineer', 'Data Analyst', 'DevOps Engineer', 'SDE Intern',
];

const EXPERIENCE_LEVELS = ['Intern', 'Fresher', '1 Year', '2+ Years'];

const INTERVIEW_ROUNDS = [
  'Online Assessment', 'Technical Round', 'HR Round', 'System Design', 'Mixed',
];

const DURATIONS = [15, 20, 30, 45, 60];

function ChipGroup({ options, selected, onSelect, accentColor = '#7c3aed' }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onSelect(opt)}
          style={selected === opt ? { borderColor: accentColor, color: accentColor, background: `${accentColor}14` } : {}}
          className={`chip-p ${selected === opt ? 'chip-p--active' : ''}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function PlacementSetupPage() {
  const navigate = useNavigate();
  const [company, setCompany] = useState('');
  const [customCompany, setCustomCompany] = useState('');
  const [role, setRole] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [round, setRound] = useState('');
  const [duration, setDuration] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const effectiveCompany = company || customCompany.trim();
  const effectiveRole = role || customRole.trim();

  const handleCompanyChip = (c) => { setCompany(c); setCustomCompany(''); };
  const handleRoleChip = (r) => { setRole(r); setCustomRole(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!effectiveCompany) return setError('Please select or enter a company.');
    if (!effectiveRole) return setError('Please select or enter a role.');
    if (!experienceLevel) return setError('Please select an experience level.');
    if (!round) return setError('Please select an interview round.');

    setSubmitting(true);
    try {
      const data = await interviewService.createSession({
        mode: 'placement',
        company: effectiveCompany,
        role: effectiveRole,
        experienceLevel,
        round,
        duration,
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
        .setup-page-p {
          min-height: calc(100vh - 4rem);
          background: var(--theme-background);
          padding: 3rem 1rem;
        }

        .setup-container-p {
          max-width: 760px;
          margin: 0 auto;
        }

        .setup-badge-p {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0.3rem 0.875rem;
          border-radius: 99px;
          background: rgba(124, 58, 237, 0.10);
          color: #7c3aed;
          margin-bottom: 0.875rem;
        }

        .setup-title-p {
          font-size: 2rem;
          font-weight: 700;
          color: var(--theme-text);
          letter-spacing: -0.02em;
          margin-bottom: 0.5rem;
        }

        .setup-subtitle-p {
          font-size: 0.9375rem;
          color: var(--theme-secondary-text);
        }

        .setup-card-p {
          background: var(--theme-surface);
          border: 1px solid var(--theme-border);
          border-radius: 1.25rem;
          padding: 1.75rem;
          margin-bottom: 1.25rem;
          box-shadow: 0 2px 12px rgba(15, 23, 42, 0.05);
        }

        .setup-card-p__label {
          font-size: 0.8125rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--theme-muted-text);
          margin-bottom: 0.875rem;
        }

        .chip-p {
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

        .chip-p:hover {
          border-color: #c4b5fd;
          color: #7c3aed;
          background: rgba(124, 58, 237, 0.06);
        }

        .chip-p--active {
          border-color: #7c3aed;
          background: rgba(124, 58, 237, 0.10);
          color: #7c3aed;
          font-weight: 600;
        }

        .segmented-p {
          display: flex;
          background: var(--theme-surface-alt);
          border-radius: 0.75rem;
          padding: 0.25rem;
          gap: 0.25rem;
        }

        .segmented-p__btn {
          flex: 1;
          padding: 0.625rem;
          border-radius: 0.5rem;
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--theme-secondary-text);
          cursor: pointer;
          border: none;
          background: transparent;
          transition: all 180ms ease;
          text-align: center;
        }

        .segmented-p__btn--active {
          background: var(--theme-surface);
          color: #7c3aed;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
        }

        .custom-input-p {
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

        .custom-input-p::placeholder { color: var(--theme-muted-text); }

        .custom-input-p:focus {
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
        }

        .voice-banner-p {
          display: flex;
          align-items: flex-start;
          gap: 0.875rem;
          padding: 1rem 1.25rem;
          border-radius: 0.875rem;
          background: linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(196,181,253,0.10) 100%);
          border: 1px solid rgba(124, 58, 237, 0.18);
          margin-bottom: 1.25rem;
        }

        .voice-banner-p__icon { font-size: 1.25rem; flex-shrink: 0; margin-top: 0.1rem; }

        .voice-banner-p__text {
          font-size: 0.8125rem;
          color: var(--theme-secondary-text);
          line-height: 1.6;
        }

        .voice-banner-p__text strong { color: var(--theme-text); }

        .submit-btn-p {
          width: 100%;
          padding: 0.875rem;
          border-radius: 0.875rem;
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
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

        .submit-btn-p:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
        .submit-btn-p:disabled { opacity: 0.55; cursor: not-allowed; }

        .error-msg-p {
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #ef4444;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 1rem;
        }

        .back-btn-p {
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

        .back-btn-p:hover { color: var(--theme-text); }
      `}</style>

      <div className="setup-page-p">
        <div className="setup-container-p">
          <button className="back-btn-p" onClick={() => navigate('/dashboard')}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Dashboard
          </button>

          <div style={{ marginBottom: '2rem' }}>
            <div className="setup-badge-p">🏢 Placement Mode</div>
            <h1 className="setup-title-p">Set Up Your Placement Interview</h1>
            <p className="setup-subtitle-p">Configure your company, role, and interview round for a targeted placement simulation.</p>
          </div>

          <div className="voice-banner-p">
            <span className="voice-banner-p__icon">🎙️</span>
            <p className="voice-banner-p__text">
              <strong>Voice & Camera Interview:</strong> AI interviews use voice interaction and camera monitoring to simulate a real interview experience. Ensure your microphone and camera are ready before starting.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Company */}
            <div className="setup-card-p">
              <p className="setup-card-p__label">Target Company</p>
              <ChipGroup options={PRESET_COMPANIES} selected={company} onSelect={handleCompanyChip} />
              <input
                type="text"
                className="custom-input-p"
                placeholder="Or enter a custom company (e.g. Goldman Sachs, Zomato, NVIDIA…)"
                value={customCompany}
                onChange={(e) => { setCustomCompany(e.target.value); setCompany(''); }}
              />
            </div>

            {/* Role */}
            <div className="setup-card-p">
              <p className="setup-card-p__label">Target Role</p>
              <ChipGroup options={PRESET_ROLES} selected={role} onSelect={handleRoleChip} />
              <input
                type="text"
                className="custom-input-p"
                placeholder="Or enter a custom role (e.g. ML Engineer, Product Manager…)"
                value={customRole}
                onChange={(e) => { setCustomRole(e.target.value); setRole(''); }}
              />
            </div>

            {/* Experience Level */}
            <div className="setup-card-p">
              <p className="setup-card-p__label">Experience Level</p>
              <div className="segmented-p">
                {EXPERIENCE_LEVELS.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    className={`segmented-p__btn ${experienceLevel === lvl ? 'segmented-p__btn--active' : ''}`}
                    onClick={() => setExperienceLevel(lvl)}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Interview Round */}
            <div className="setup-card-p">
              <p className="setup-card-p__label">Interview Round</p>
              <ChipGroup options={INTERVIEW_ROUNDS} selected={round} onSelect={setRound} />
            </div>

            {/* Duration */}
            <div className="setup-card-p">
              <p className="setup-card-p__label">Interview Duration</p>
              <div className="segmented-p">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`segmented-p__btn ${duration === d ? 'segmented-p__btn--active' : ''}`}
                    onClick={() => setDuration(d)}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="error-msg-p">{error}</div>}

            <button type="submit" className="submit-btn-p" disabled={submitting}>
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

export default PlacementSetupPage;
