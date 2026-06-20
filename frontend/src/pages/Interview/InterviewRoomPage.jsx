import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { interviewService } from '../../services/interview.service.js';

// ─── helpers ────────────────────────────────────────────────────────────────

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// Text-to-Speech: speak a string aloud, return a promise that resolves when done
function speak(text) {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) { resolve(); return; }
    window.speechSynthesis.cancel(); // cancel any ongoing speech
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.95;
    utt.pitch = 1;
    utt.lang = 'en-US';
    // pick a natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.name.toLowerCase().includes('google') ||
      v.name.toLowerCase().includes('natural') ||
      v.lang === 'en-US'
    );
    if (preferred) utt.voice = preferred;
    utt.onend = resolve;
    utt.onerror = resolve;
    window.speechSynthesis.speak(utt);
  });
}

// ─── SpeechRecognition setup ────────────────────────────────────────────────

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

// ─── Component ───────────────────────────────────────────────────────────────

function InterviewRoomPage() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Session + question bootstrap
  const [session, setSession] = useState(location.state?.session || null);
  const [loading, setLoading] = useState(!location.state?.session);
  const [error, setError] = useState('');
  const [speechError, setSpeechError] = useState('');

  // Conversation state: array of { role: 'ai'|'candidate', content: string }
  const [conversation, setConversation] = useState(() => {
    const firstQ = location.state?.firstQuestion;
    return firstQ ? [{ role: 'ai', content: firstQ }] : [];
  });

  // Current AI question displayed prominently
  const [currentAiMessage, setCurrentAiMessage] = useState(location.state?.firstQuestion || '');

  // Voice / mic state
  const [transcript, setTranscript] = useState('');      // live interim transcript
  const [finalTranscript, setFinalTranscript] = useState(''); // accumulated final
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);   // AI is speaking TTS
  const [isThinking, setIsThinking] = useState(false);   // waiting for Gemini

  // Timer
  const [time, setTime] = useState(0);

  // Camera
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Speech recognition ref
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const SILENCE_DELAY_MS = 2500;

  // Conversation scroll
  const conversationEndRef = useRef(null);

  // ── Fetch session if not in router state ─────────────────────────────────
  useEffect(() => {
    if (!session) {
      interviewService.getSession(sessionId)
        .then(data => {
          setSession(data.session);
          const firstQ = data.session.firstQuestion;
          if (firstQ && conversation.length === 0) {
            setConversation([{ role: 'ai', content: firstQ }]);
            setCurrentAiMessage(firstQ);
          }
        })
        .catch(err => setError(err?.response?.data?.message || 'Session not found.'))
        .finally(() => setLoading(false));
    }
  }, [sessionId]);

  // ── Camera setup ─────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => {}); // permissions already granted on summary page
    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // ── Timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // ── Auto-scroll conversation ──────────────────────────────────────────────
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, transcript]);

  // ── Speak the first AI question on mount ─────────────────────────────────
  useEffect(() => {
    if (currentAiMessage && !isSpeaking) {
      setIsSpeaking(true);
      speak(currentAiMessage).then(() => {
        setIsSpeaking(false);
        startListening();
      });
    }
    // Cleanup TTS on unmount
    return () => window.speechSynthesis?.cancel();
  }, []); // run once on mount

  // ── Speech Recognition ───────────────────────────────────────────────────

  const startListening = useCallback(() => {
    setSpeechError('');
    if (!SpeechRecognition) {
      const msg = 'Speech Recognition is not supported in this browser.';
      console.error(msg);
      setSpeechError(msg);
      return;
    }
    if (isListening) return;

    console.log('[Speech] Initializing recognition...');
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    let accumulated = '';

    recognition.onstart = () => {
      console.log('[Speech] Recognition started successfully. Listening for audio...');
    };

    recognition.onaudiostart = () => console.log('[Speech] Audio capturing started.');
    recognition.onsoundstart = () => console.log('[Speech] Sound detected.');
    recognition.onspeechstart = () => console.log('[Speech] Speech detected.');

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          accumulated += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }
      console.log(`[Speech] Transcript received - Interim: "${interim.trim()}" | Final: "${accumulated.trim()}"`);
      
      setFinalTranscript(accumulated);
      setTranscript(interim);

      // Reset silence timer on any speech
      clearTimeout(silenceTimerRef.current);
      if (accumulated.trim() || interim.trim()) {
        silenceTimerRef.current = setTimeout(() => {
          if (accumulated.trim()) {
            console.log('[Speech] Silence detected for 2.5s. Auto-submitting...');
            submitAnswer(accumulated.trim());
          }
        }, SILENCE_DELAY_MS);
      }
    };

    recognition.onerror = (e) => {
      console.error('[Speech] SpeechRecognition error:', e.error);
      if (e.error !== 'no-speech') {
        setSpeechError(`Speech API Error: ${e.error}`);
      }
    };

    recognition.onend = () => {
      console.log('[Speech] Recognition ended.');
      setIsListening(false);
    };

    try {
      recognition.start();
      setIsListening(true);
      setFinalTranscript('');
      setTranscript('');
    } catch (err) {
      console.error('[Speech] Failed to start recognition:', err);
      setSpeechError(`Failed to start recognition: ${err.message}`);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    console.log('[Speech] Stopping recognition manually.');
    clearTimeout(silenceTimerRef.current);
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  // ── Submit answer to backend → Gemini → next question ────────────────────

  // Use functional state updates to avoid closure traps for conversation
  const submitAnswer = useCallback(async (answerText) => {
    if (!answerText || isThinking) return;
    
    console.log(`[Submit] Answer submitted: "${answerText}"`);

    stopListening();
    clearTimeout(silenceTimerRef.current);
    setIsThinking(true);

    // Append candidate answer to conversation using functional update
    const candidateMsg = { role: 'candidate', content: answerText };
    setConversation(prev => [...prev, candidateMsg]);
    setFinalTranscript('');
    setTranscript('');

    try {
      // Need the latest conversation for the API call. Since state is async,
      // we'll fetch the latest from the setState callback implicitly or just use the current ref.
      // Wait, we need the CURRENT conversation array to send to backend.
      setConversation(currentConv => {
        const updatedConversation = [...currentConv];
        // Only push if it's not already the last message (prevent double push in strict mode or race conditions)
        if (updatedConversation.length === 0 || updatedConversation[updatedConversation.length - 1].content !== answerText) {
             // We already added it in the outer setConversation, but let's just do it cleanly here.
        }
        
        // Fire async call
        const apiConversation = [...updatedConversation];
        interviewService.sendMessage(sessionId, answerText, apiConversation)
          .then(data => {
            if (data.success) {
              const aiMsg = { role: 'ai', content: data.aiResponse };
              setConversation(prev => [...prev, aiMsg]);
              setCurrentAiMessage(data.aiResponse);
      
              console.log('[Submit] AI Response received. Speaking...');
              setIsSpeaking(true);
              setIsThinking(false);
              speak(data.aiResponse).then(() => {
                setIsSpeaking(false);
                startListening();
              });
            } else {
              setIsThinking(false);
              setError(data.message || 'Failed to get AI response.');
            }
          })
          .catch(err => {
            setIsThinking(false);
            setError(err?.response?.data?.message || 'Connection error. Please check your network.');
          });

        return currentConv; 
      });
    } catch (err) {
      setIsThinking(false);
      setError('Unexpected error submitting answer.');
    }
  }, [isThinking, sessionId, stopListening, startListening]);

  // ── Manual submit (fallback button) ─────────────────────────────────────
  const handleManualSubmit = () => {
    const answer = (finalTranscript + ' ' + transcript).trim();
    if (answer) {
      submitAnswer(answer);
    }
  };

  // ── End interview ────────────────────────────────────────────────────────
  const handleEndInterview = async () => {
    stopListening();
    window.speechSynthesis?.cancel();
    streamRef.current?.getTracks().forEach(t => t.stop());
    try {
      await interviewService.updateSessionStatus(sessionId, 'completed');
    } catch (_) {}
    navigate('/dashboard');
  };

  // ── Loading / Error states ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="room-loading">
        <div className="room-spinner" />
        <p>Preparing your interview room…</p>
        <style>{`
          .room-loading {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; min-height: 100vh;
            background: #0a0f1e; color: #94a3b8; gap: 1rem;
          }
          .room-spinner {
            width: 36px; height: 36px;
            border: 3px solid rgba(99,102,241,0.2);
            border-top-color: #6366f1; border-radius: 50%;
            animation: spin 700ms linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="room-error">
        <p>⚠️ {error}</p>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        <style>{`
          .room-error {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; min-height: 100vh;
            background: #0a0f1e; color: #94a3b8; gap: 1.5rem;
          }
          .room-error button {
            padding: 0.6rem 1.5rem; border-radius: 0.5rem;
            background: #1e293b; border: 1px solid #334155;
            color: #e2e8f0; cursor: pointer;
          }
        `}</style>
      </div>
    );
  }

  const modeBadge = session?.mode === 'learning' ? '🧠 Learning Mode' : '🏢 Placement Mode';
  const interviewTitle = session?.mode === 'learning' ? session?.topic : session?.company;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }

        .ir-root {
          display: grid;
          grid-template-rows: auto 1fr auto;
          min-height: calc(100vh - 4rem);
          background: #080d1a;
          color: #e2e8f0;
          font-family: 'Inter', system-ui, sans-serif;
        }

        /* ── Header ── */
        .ir-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.875rem 2rem;
          background: #0d1426;
          border-bottom: 1px solid rgba(99,102,241,0.15);
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .ir-header-left { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
        .ir-mode-badge {
          font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.08em; padding: 0.25rem 0.75rem; border-radius: 99px;
          background: rgba(99,102,241,0.12); color: #818cf8;
          border: 1px solid rgba(99,102,241,0.2);
        }
        .ir-title { font-size: 1.1rem; font-weight: 700; color: #f1f5f9; }
        .ir-subtitle { font-size: 0.8rem; color: #64748b; }

        .ir-timer {
          display: flex; align-items: center; gap: 0.5rem;
          background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
          border-radius: 0.5rem; padding: 0.35rem 0.875rem;
        }
        .ir-timer-dot {
          width: 7px; height: 7px; border-radius: 50%; background: #ef4444;
          animation: blink 1.2s ease-in-out infinite;
        }
        @keyframes blink { 0%,100% { opacity:0.3; } 50% { opacity:1; } }
        .ir-timer-val {
          font-family: 'SF Mono', 'Fira Code', monospace;
          font-size: 0.9rem; font-weight: 600; color: #f8fafc;
        }

        /* ── Main grid ── */
        .ir-main {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 1.5rem;
          padding: 1.5rem 2rem;
          overflow: hidden;
        }
        @media (max-width: 860px) {
          .ir-main { grid-template-columns: 1fr; }
        }

        /* ── Camera panel ── */
        .ir-camera-panel {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          position: sticky;
          top: 1.5rem;
          align-self: start;
        }
        .ir-video-wrap {
          position: relative;
          border-radius: 1rem;
          overflow: hidden;
          background: #0d1426;
          border: 1px solid rgba(99,102,241,0.15);
          aspect-ratio: 4/3;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .ir-video {
          width: 100%; height: 100%; object-fit: cover; display: block;
        }
        .ir-live-pill {
          position: absolute; top: 0.625rem; left: 0.625rem;
          background: rgba(239,68,68,0.9); color: white;
          font-size: 0.6rem; font-weight: 700; padding: 0.15rem 0.5rem;
          border-radius: 4px; letter-spacing: 0.06em;
        }

        /* AI status card */
        .ir-ai-card {
          background: #0d1426;
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: 0.875rem;
          padding: 1rem;
        }
        .ir-ai-label {
          font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: #4f46e5; margin-bottom: 0.5rem;
        }
        .ir-ai-status-row {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.8rem; color: #94a3b8; font-weight: 500;
        }
        .ir-status-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #334155; flex-shrink: 0;
        }
        .ir-status-dot--green {
          background: #22c55e;
          box-shadow: 0 0 6px rgba(34,197,94,0.5);
          animation: pulse 1.5s ease-in-out infinite;
        }
        .ir-status-dot--yellow {
          background: #f59e0b;
          box-shadow: 0 0 6px rgba(245,158,11,0.5);
          animation: pulse 1.2s ease-in-out infinite;
        }
        .ir-status-dot--blue {
          background: #6366f1;
          box-shadow: 0 0 6px rgba(99,102,241,0.5);
          animation: pulse 1s ease-in-out infinite;
        }
        @keyframes pulse {
          0%,100% { transform: scale(1); opacity:1; }
          50% { transform: scale(1.25); opacity:0.6; }
        }

        /* ── Content panel ── */
        .ir-content-panel {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          overflow: hidden;
          max-height: calc(100vh - 10rem);
        }

        /* Current AI question card */
        .ir-question-card {
          background: linear-gradient(135deg, #0d1426 0%, #111827 100%);
          border: 1px solid rgba(99,102,241,0.25);
          border-radius: 1.25rem;
          padding: 1.75rem;
          box-shadow: 0 4px 24px rgba(99,102,241,0.08);
          flex-shrink: 0;
        }
        .ir-question-card-header {
          display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;
        }
        .ir-ai-avatar {
          width: 40px; height: 40px; border-radius: 50%;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem; flex-shrink: 0;
          box-shadow: 0 0 16px rgba(99,102,241,0.3);
        }
        .ir-ai-name { font-size: 0.875rem; font-weight: 700; color: #f1f5f9; }
        .ir-ai-active {
          font-size: 0.7rem; color: #22c55e;
          display: flex; align-items: center; gap: 0.3rem;
        }
        .ir-ai-active::before {
          content: ''; width: 5px; height: 5px; border-radius: 50%;
          background: #22c55e; display: inline-block;
          animation: pulse 1.5s infinite;
        }
        .ir-question-text {
          font-size: 1.0625rem; line-height: 1.65; font-weight: 500;
          color: #e2e8f0; white-space: pre-wrap;
        }

        /* Thinking overlay */
        .ir-thinking {
          display: flex; align-items: center; gap: 0.5rem;
          color: #6366f1; font-size: 0.875rem; font-style: italic;
          padding: 0.75rem 0;
        }
        .ir-dots { display: flex; gap: 4px; }
        .ir-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #6366f1; animation: dotbounce 1.2s infinite;
        }
        .ir-dot:nth-child(2) { animation-delay: 0.2s; }
        .ir-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dotbounce {
          0%,80%,100% { transform: translateY(0); opacity:0.4; }
          40% { transform: translateY(-6px); opacity:1; }
        }

        /* Conversation history */
        .ir-history {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding-right: 0.25rem;
          scrollbar-width: thin;
          scrollbar-color: #1e293b transparent;
        }
        .ir-history::-webkit-scrollbar { width: 4px; }
        .ir-history::-webkit-scrollbar-track { background: transparent; }
        .ir-history::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }

        .ir-msg {
          display: flex;
          gap: 0.625rem;
          max-width: 90%;
          animation: fadein 0.25s ease;
        }
        @keyframes fadein { from { opacity:0; transform: translateY(6px); } to { opacity:1; transform: none; } }
        .ir-msg--ai { align-self: flex-start; }
        .ir-msg--candidate { align-self: flex-end; flex-direction: row-reverse; }

        .ir-msg-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; flex-shrink: 0; margin-top: 2px;
        }
        .ir-msg-avatar--ai {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          box-shadow: 0 0 8px rgba(99,102,241,0.3);
        }
        .ir-msg-avatar--candidate {
          background: linear-gradient(135deg, #059669, #10b981);
        }

        .ir-msg-bubble {
          border-radius: 1rem;
          padding: 0.625rem 1rem;
          font-size: 0.85rem;
          line-height: 1.55;
          max-width: 100%;
          white-space: pre-wrap;
        }
        .ir-msg-bubble--ai {
          background: rgba(99,102,241,0.08);
          border: 1px solid rgba(99,102,241,0.15);
          color: #c7d2fe;
          border-top-left-radius: 0.25rem;
        }
        .ir-msg-bubble--candidate {
          background: rgba(16,185,129,0.1);
          border: 1px solid rgba(16,185,129,0.15);
          color: #a7f3d0;
          border-top-right-radius: 0.25rem;
        }

        /* Live transcript area */
        .ir-transcript-area {
          background: #0d1426;
          border: 1px solid rgba(99,102,241,0.15);
          border-radius: 1rem;
          padding: 1.125rem 1.25rem;
          flex-shrink: 0;
        }
        .ir-transcript-label {
          font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: #475569; margin-bottom: 0.625rem;
          display: flex; align-items: center; gap: 0.5rem;
        }
        .ir-mic-wave {
          display: flex; align-items: flex-end; gap: 2px; height: 12px;
        }
        .ir-wave-bar {
          width: 3px; background: #22c55e; border-radius: 2px;
          animation: wave 0.8s ease-in-out infinite alternate;
        }
        .ir-wave-bar:nth-child(2) { animation-delay: 0.1s; height: 6px; }
        .ir-wave-bar:nth-child(3) { animation-delay: 0.2s; height: 9px; }
        .ir-wave-bar:nth-child(4) { animation-delay: 0.15s; height: 7px; }
        .ir-wave-bar:nth-child(5) { animation-delay: 0.05s; height: 4px; }
        @keyframes wave {
          from { transform: scaleY(0.3); }
          to { transform: scaleY(1); }
        }
        .ir-transcript-text {
          font-size: 0.9rem; color: #e2e8f0; line-height: 1.55; min-height: 1.3rem;
        }
        .ir-transcript-interim { color: #94a3b8; font-style: italic; }
        .ir-transcript-empty { color: #334155; font-style: italic; font-size: 0.85rem; }

        /* ── Footer ── */
        .ir-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 2rem;
          background: #0d1426;
          border-top: 1px solid rgba(99,102,241,0.15);
          gap: 1rem;
          flex-wrap: wrap;
        }
        .ir-footer-left {
          display: flex; align-items: center; gap: 1rem;
        }
        .ir-footer-status {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.8rem; color: #64748b; font-weight: 500;
        }

        .ir-submit-btn {
          padding: 0.55rem 1.25rem;
          border-radius: 0.625rem;
          font-size: 0.8rem; font-weight: 600;
          color: #e2e8f0;
          background: rgba(99,102,241,0.15);
          border: 1px solid rgba(99,102,241,0.3);
          cursor: pointer;
          transition: background 160ms, opacity 160ms;
        }
        .ir-submit-btn:hover:not(:disabled) {
          background: rgba(99,102,241,0.25);
        }
        .ir-submit-btn:disabled {
          opacity: 0.35; cursor: not-allowed;
        }

        .ir-end-btn {
          padding: 0.6rem 1.5rem;
          border-radius: 0.75rem;
          font-size: 0.875rem; font-weight: 600;
          color: white;
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          border: none; cursor: pointer;
          transition: opacity 160ms, transform 100ms;
          box-shadow: 0 4px 16px rgba(220,38,38,0.25);
        }
        .ir-end-btn:hover { opacity: 0.9; }
        .ir-end-btn:active { transform: scale(0.97); }
      `}</style>

      <div className="ir-root">

        {/* ── Header ── */}
        <header className="ir-header">
          <div className="ir-header-left">
            <span className="ir-mode-badge">{modeBadge}</span>
            <div>
              <div className="ir-title">{interviewTitle || 'Interview Session'}</div>
              {session?.role && <div className="ir-subtitle">• {session.role}</div>}
              {session?.mode === 'learning' && session?.difficulty && (
                <div className="ir-subtitle">• {session.difficulty}</div>
              )}
            </div>
          </div>
          <div className="ir-timer">
            <span className="ir-timer-dot" />
            <span className="ir-timer-val">{formatTime(time)}</span>
          </div>
        </header>

        {/* ── Main ── */}
        <main className="ir-main">

          {/* Left: camera + status */}
          <aside className="ir-camera-panel">
            <div className="ir-video-wrap">
              <video ref={videoRef} autoPlay playsInline muted className="ir-video" />
              <span className="ir-live-pill">● LIVE</span>
            </div>

            <div className="ir-ai-card">
              <div className="ir-ai-label">Interview Status</div>
              <div className="ir-ai-status-row" style={{ marginBottom: '0.5rem' }}>
                <span className={`ir-status-dot ${isListening ? 'ir-status-dot--green' : 'ir-status-dot--gray'}`} />
                {isListening ? 'Microphone active — listening' : 'Microphone inactive'}
              </div>
              <div className="ir-ai-status-row" style={{ marginBottom: '0.5rem' }}>
                <span className={`ir-status-dot ${isSpeaking ? 'ir-status-dot--blue' : 'ir-status-dot--gray'}`} />
                {isSpeaking ? 'AI is speaking…' : 'AI idle'}
              </div>
              <div className="ir-ai-status-row">
                <span className={`ir-status-dot ${isThinking ? 'ir-status-dot--yellow' : 'ir-status-dot--gray'}`} />
                {isThinking ? 'Generating next question…' : 'Ready'}
              </div>
            </div>
          </aside>

          {/* Right: conversation + transcript */}
          <section className="ir-content-panel">

            {/* Current question display */}
            <div className="ir-question-card">
              <div className="ir-question-card-header">
                <div className="ir-ai-avatar">🤖</div>
                <div>
                  <div className="ir-ai-name">AscendIQ AI Interviewer</div>
                  <div className="ir-ai-active">
                    {isSpeaking ? 'speaking' : isThinking ? 'thinking' : isListening ? 'listening' : 'active'}
                  </div>
                </div>
              </div>

              {isThinking ? (
                <div className="ir-thinking">
                  <div className="ir-dots">
                    <span className="ir-dot" /><span className="ir-dot" /><span className="ir-dot" />
                  </div>
                  Generating next question…
                </div>
              ) : (
                <div className="ir-question-text">{currentAiMessage}</div>
              )}
            </div>

            {/* Conversation history (all previous turns) */}
            {conversation.length > 1 && (
              <div className="ir-history">
                {conversation.slice(0, -1).map((msg, idx) => (
                  <div key={idx} className={`ir-msg ir-msg--${msg.role}`}>
                    <div className={`ir-msg-avatar ir-msg-avatar--${msg.role}`}>
                      {msg.role === 'ai' ? '🤖' : '🙂'}
                    </div>
                    <div className={`ir-msg-bubble ir-msg-bubble--${msg.role}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={conversationEndRef} />
              </div>
            )}

            {/* Live transcript */}
            <div className="ir-transcript-area">
              <div className="ir-transcript-label">
                {isListening && (
                  <div className="ir-mic-wave">
                    <div className="ir-wave-bar" style={{ height: '5px' }} />
                    <div className="ir-wave-bar" />
                    <div className="ir-wave-bar" />
                    <div className="ir-wave-bar" />
                    <div className="ir-wave-bar" style={{ height: '3px' }} />
                  </div>
                )}
                Your Answer {isListening ? '— Listening' : ''}
              </div>
              
              {speechError && (
                <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>
                  ⚠️ {speechError}
                </div>
              )}

              <div className="ir-transcript-text">
                {finalTranscript && <span>{finalTranscript}</span>}
                {transcript && <span className="ir-transcript-interim">{transcript}</span>}
                {!finalTranscript && !transcript && (
                  <span className="ir-transcript-empty">
                    {isSpeaking
                      ? 'AI is speaking — please wait…'
                      : isThinking
                      ? 'Generating next question…'
                      : isListening
                      ? 'Speak your answer… (auto-submits after 2.5s of silence)'
                      : 'Ready for your answer.'}
                  </span>
                )}
              </div>
            </div>

          </section>
        </main>

        {/* ── Footer ── */}
        <footer className="ir-footer">
          <div className="ir-footer-left">
            <div className="ir-footer-status">
              <span className={`ir-status-dot ${isListening ? 'ir-status-dot--green' : 'ir-status-dot--gray'}`} />
              {isListening ? '🎙️ Listening' : isSpeaking ? '🔊 AI Speaking' : '⏸ Paused'}
            </div>

            <button
              className="ir-submit-btn"
              disabled={!finalTranscript && !transcript || isSpeaking || isThinking}
              onClick={handleManualSubmit}
            >
              Submit Answer
            </button>
          </div>

          <button className="ir-end-btn" onClick={handleEndInterview}>
            End Interview
          </button>
        </footer>

      </div>
    </>
  );
}

export default InterviewRoomPage;
