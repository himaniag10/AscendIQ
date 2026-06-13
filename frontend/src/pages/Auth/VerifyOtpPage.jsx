import { useContext, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { authService } from '../../services/auth.service.js';

function VerifyOtpPage() {
  const { verifyOTP } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(location.state?.email || searchParams.get('email') || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(location.state?.message || '');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(45);
  const inputs = useRef([]);

  useEffect(() => {
    window.setTimeout(() => inputs.current[0]?.focus(), 80);
  }, []);

  useEffect(() => {
    if (timer === 0) return undefined;
    const id = window.setInterval(() => setTimer((value) => Math.max(value - 1, 0)), 1000);
    return () => window.clearInterval(id);
  }, [timer]);

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) inputs.current[index + 1]?.focus();
  };

  const handlePaste = (event) => {
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('');
    if (!digits.length) return;
    event.preventDefault();
    setOtp(Array.from({ length: 6 }, (_, index) => digits[index] || ''));
    inputs.current[Math.min(digits.length, 5)]?.focus();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const code = otp.join('');
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter the email address used during registration.');
      return;
    }
    if (code.length !== 6) {
      setError('Enter the 6 digit OTP from your email.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await verifyOTP({ email, otp: code });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Unable to verify OTP.');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter your email before requesting a new OTP.');
      return;
    }
    try {
      const response = await authService.resendOTP(email);
      setMessage(response.message || 'A new OTP has been sent to your email.');
      setError('');
      setTimer(45);
    } catch (err) {
      setError(err.message || 'Unable to resend OTP.');
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <section className="w-full max-w-lg rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-8 shadow-[var(--theme-shadow)]">
        <p className="text-sm font-semibold uppercase text-[var(--theme-primary)]">Email verification</p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--theme-text)]">Enter your OTP</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--theme-secondary-text)]">
          We sent a 6 digit verification code to your email. Enter it below to activate your AscendIQ account.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />

          <div>
            <span className="mb-2 block text-sm font-medium text-[var(--theme-secondary-text)]">OTP Code</span>
            <div className="grid grid-cols-6 gap-2" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(node) => { inputs.current[index] = node; }}
                  value={digit}
                  onChange={(event) => handleOtpChange(index, event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Backspace' && !otp[index] && index > 0) inputs.current[index - 1]?.focus();
                  }}
                  className="h-14 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-alt)] text-center text-xl font-semibold text-[var(--theme-text)] outline-none focus:border-[var(--theme-primary)] focus:ring-4 focus:ring-[var(--theme-primary-soft)]"
                  inputMode="numeric"
                  maxLength={1}
                  aria-label={`OTP digit ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {message && <p className="rounded-lg bg-emerald-500/10 px-4 py-3 text-sm font-medium text-[var(--theme-success)]">{message}</p>}
          {error && <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm font-medium text-[var(--theme-danger)]">{error}</p>}

          <div className="flex items-center justify-between gap-4 text-sm text-[var(--theme-secondary-text)]">
            <span>{timer ? `Resend OTP in ${timer}s` : 'Need another code?'}</span>
            <button type="button" disabled={timer > 0} onClick={resendOtp} className="font-semibold text-[var(--theme-primary)] disabled:text-[var(--theme-muted-text)]">
              Resend OTP
            </button>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Verifying...' : 'Verify Account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--theme-secondary-text)]">
          Used a different email?{' '}
          <Link to="/register" className="font-semibold text-[var(--theme-primary)] hover:text-[var(--theme-primary-hover)]">
            Register again
          </Link>
        </p>
      </section>
    </div>
  );
}

export default VerifyOtpPage;
