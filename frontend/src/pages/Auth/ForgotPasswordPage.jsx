import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { authService } from '../../services/auth.service.js';

function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [passwords, setPasswords] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(45);
  const inputs = useRef([]);

  useEffect(() => {
    if (step !== 2 || timer === 0) return undefined;
    const id = window.setInterval(() => setTimer((value) => Math.max(value - 1, 0)), 1000);
    return () => window.clearInterval(id);
  }, [step, timer]);

  const submitEmail = async (event) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setStep(2);
      setTimer(45);
      window.setTimeout(() => inputs.current[0]?.focus(), 50);
    } catch (err) {
      setError(err.response?.data?.errors?.[0] || err.message || 'Unable to start password recovery.');
    } finally {
      setLoading(false);
    }
  };

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

  const submitOtp = async (event) => {
    event.preventDefault();
    const code = otp.join('');

    if (code.length !== 6) {
      setError('Enter the 6 digit OTP.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await authService.verifyOTP(email, code);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.errors?.[0] || err.message || 'Unable to verify the OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    if (passwords.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (passwords.password !== passwords.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await authService.resetPassword(email, otp.join(''), passwords.password);
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.errors?.[0] || err.message || 'Unable to reset your password. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <section className="w-full max-w-lg rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-8 shadow-[var(--theme-shadow)]">
        <p className="text-sm font-semibold uppercase text-[var(--theme-primary)]">Account recovery</p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--theme-text)]">
          {step === 1 && 'Reset your password'}
          {step === 2 && 'Verify OTP'}
          {step === 3 && 'Create new password'}
          {step === 4 && 'Password updated'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--theme-secondary-text)]">
          {step === 1 && 'Enter your email and we will guide you through a secure reset flow.'}
          {step === 2 && `Enter the 6 digit code sent to ${email}.`}
          {step === 3 && 'Choose a strong password for your AscendIQ account.'}
          {step === 4 && 'Your password reset UI flow is complete. Use the login page to continue.'}
        </p>

        {step === 1 && (
          <form onSubmit={submitEmail} className="mt-8 space-y-5">
            <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} error={error} autoComplete="email" />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={submitOtp} className="mt-8 space-y-6">
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
                />
              ))}
            </div>
            {error && <p className="text-sm font-medium text-[var(--theme-danger)]">{error}</p>}
            <div className="flex items-center justify-between text-sm text-[var(--theme-secondary-text)]">
              <span>{timer ? `Resend OTP in ${timer}s` : 'You can resend the OTP now.'}</span>
              <button
                type="button"
                disabled={timer > 0}
                onClick={async () => {
                  try {
                    await authService.forgotPassword(email);
                    setError('');
                    setTimer(45);
                  } catch (err) {
                    setError(err.response?.data?.errors?.[0] || err.message || 'Unable to resend OTP.');
                  }
                }}
                className="font-semibold text-[var(--theme-primary)] disabled:text-[var(--theme-muted-text)]"
              >
                Resend
              </button>
            </div>
            <Button type="submit" className="w-full">Verify OTP</Button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={submitPassword} className="mt-8 space-y-5">
            <Input label="New Password" type="password" value={passwords.password} onChange={(event) => setPasswords((prev) => ({ ...prev, password: event.target.value }))} />
            <Input label="Confirm Password" type="password" value={passwords.confirmPassword} onChange={(event) => setPasswords((prev) => ({ ...prev, confirmPassword: event.target.value }))} />
            {error && <p className="text-sm font-medium text-[var(--theme-danger)]">{error}</p>}
            <Button type="submit" className="w-full">Update Password</Button>
          </form>
        )}

        {step === 4 && (
          <div className="mt-8">
            <Link to="/login">
              <Button className="w-full">Back to Login</Button>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

export default ForgotPasswordPage;
