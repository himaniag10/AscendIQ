import { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';

const GOOGLE_SCRIPT_ID = 'google-identity-services';

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existing = document.getElementById(GOOGLE_SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export function GoogleAuthButton({ label = 'Continue with Google', onError }) {
  const { googleLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  const buttonRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return undefined;

    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled || !buttonRef.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              await googleLogin(response.credential);
              navigate('/dashboard');
            } catch (err) {
              onError?.(err.message || 'Google authentication failed.');
            }
          },
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text: 'continue_with',
          width: buttonRef.current.offsetWidth || 360,
        });
        setReady(true);
      })
      .catch(() => onError?.('Unable to load Google sign-in.'));

    return () => {
      cancelled = true;
    };
  }, [googleLogin, navigate, onError]);

  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    return (
      <button
        type="button"
        onClick={() => onError?.('Set VITE_GOOGLE_CLIENT_ID in frontend/.env to enable Google sign-in.')}
        className="inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-3 text-sm font-semibold text-[var(--theme-text)] transition hover:bg-[var(--theme-surface-alt)]"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--theme-surface-alt)] text-xs font-black text-[var(--theme-text)]">G</span>
        {label}
      </button>
    );
  }

  return (
    <div className="min-h-11 w-full overflow-hidden rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)]">
      {!ready && (
        <div className="flex min-h-11 items-center justify-center text-sm font-semibold text-[var(--theme-secondary-text)]">
          Loading Google...
        </div>
      )}
      <div ref={buttonRef} className={ready ? 'w-full' : 'hidden'} />
    </div>
  );
}
