import { useContext, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { GoogleAuthButton } from '../../components/auth/GoogleAuthButton.jsx';

function validate(form) {
  const errors = {};
  if (form.name.trim().length < 2) errors.name = 'Full name must be at least 2 characters.';
  if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email address.';
  if (form.password.length < 8) errors.password = 'Password must be at least 8 characters.';
  if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match.';
  return errors;
}

function getStrength(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

function RegisterPage() {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const strength = useMemo(() => getStrength(form.password), [form.password]);
  const strengthLabel = ['Empty', 'Weak', 'Fair', 'Good', 'Strong'][strength];

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await register({ name: form.name, email: form.email, password: form.password });
      if (response.token) {
        navigate('/dashboard');
        return;
      }
      const message = response.message || 'Account created. Check your email for the verification code.';
      setSuccess(message);
      navigate(`/verify-otp?email=${encodeURIComponent(form.email)}`, {
        state: { email: form.email, message },
      });
    } catch (err) {
      setError(err.message || 'Unable to register. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:px-8">
      <section className="mx-auto w-full max-w-md self-center rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-8 shadow-[var(--theme-shadow)]">
        <h1 className="text-3xl font-semibold text-[var(--theme-text)]">Create your account</h1>
        <p className="mt-3 text-sm text-[var(--theme-secondary-text)]">Start preparing with a focused, measurable interview workflow.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
          <Input label="Full Name" name="name" type="text" value={form.name} onChange={handleChange} error={errors.name} autoComplete="name" />
          <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} autoComplete="email" />
          <Input
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            autoComplete="new-password"
            rightElement={
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="rounded-md px-2 py-1 text-xs font-semibold text-[var(--theme-primary)]">
                {showPassword ? 'Hide' : 'Show'}
              </button>
            }
          />
          <div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((level) => (
                <span key={level} className={`h-2 rounded-full ${strength >= level ? 'bg-[var(--theme-primary)]' : 'bg-[var(--theme-border)]'}`} />
              ))}
            </div>
            <p className="mt-2 text-xs font-medium text-[var(--theme-muted-text)]">Password strength: {strengthLabel}</p>
          </div>
          <Input
            label="Confirm Password"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />

          {error && <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm font-medium text-[var(--theme-danger)]">{error}</p>}
          {success && <p className="rounded-lg bg-emerald-500/10 px-4 py-3 text-sm font-medium text-[var(--theme-success)]">{success}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating account...' : 'Register'}
          </Button>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-[var(--theme-border)]" />
            <span className="text-xs font-semibold uppercase text-[var(--theme-muted-text)]">or</span>
            <span className="h-px flex-1 bg-[var(--theme-border)]" />
          </div>

          <GoogleAuthButton label="Register with Google" onError={setError} />
        </form>

        <p className="mt-6 text-center text-sm text-[var(--theme-secondary-text)]">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[var(--theme-primary)] hover:text-[var(--theme-primary-hover)]">
            Login
          </Link>
        </p>
      </section>

      <aside className="hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-8 shadow-sm lg:block">
        <p className="text-sm font-semibold uppercase text-[var(--theme-primary)]">Ascend faster</p>
        <h2 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--theme-text)]">A preparation command center for serious candidates.</h2>
        <div className="mt-10 grid gap-4">
          {[
            ['Practice with structure', 'Role and category based mock interviews.'],
            ['Measure readiness', 'Scores that make progress visible.'],
            ['Close weak spots', 'Learning paths based on repeated patterns.'],
          ].map(([title, body]) => (
            <div key={title} className="rounded-xl bg-[var(--theme-surface-alt)] p-5">
              <p className="font-semibold text-[var(--theme-text)]">{title}</p>
              <p className="mt-2 text-sm text-[var(--theme-secondary-text)]">{body}</p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

export default RegisterPage;
