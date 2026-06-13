import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { GoogleAuthButton } from '../../components/auth/GoogleAuthButton.jsx';

function validate(form) {
  const errors = {};
  if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email address.';
  if (!form.password) errors.password = 'Password is required.';
  return errors;
}

function LoginPage() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', remember: true });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setError('');
    setLoading(true);

    try {
      await login({ email: form.email, password: form.password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Unable to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1fr] lg:px-8">
      <aside className="hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-8 shadow-sm lg:block">
        <p className="text-sm font-semibold uppercase text-[var(--theme-primary)]">Welcome back</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--theme-text)]">Continue building interview confidence.</h1>
        <div className="mt-10 space-y-4">
          {['Personal dashboard', 'Readiness trends', 'AI feedback history'].map((item) => (
            <div key={item} className="rounded-xl bg-[var(--theme-surface-alt)] p-5">
              <p className="font-semibold text-[var(--theme-text)]">{item}</p>
              <p className="mt-2 text-sm text-[var(--theme-secondary-text)]">Resume your preparation workflow with saved session context.</p>
            </div>
          ))}
        </div>
      </aside>

      <section className="mx-auto w-full max-w-md self-center rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-8 shadow-[var(--theme-shadow)]">
        <h1 className="text-3xl font-semibold text-[var(--theme-text)]">Login</h1>
        <p className="mt-3 text-sm text-[var(--theme-secondary-text)]">Access your AscendIQ dashboard and continue preparation.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
          <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} autoComplete="email" />
          <Input
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            autoComplete="current-password"
            rightElement={
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="rounded-md px-2 py-1 text-xs font-semibold text-[var(--theme-primary)]">
                {showPassword ? 'Hide' : 'Show'}
              </button>
            }
          />

          <div className="flex items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-sm text-[var(--theme-secondary-text)]">
              <input name="remember" type="checkbox" checked={form.remember} onChange={handleChange} className="h-4 w-4 rounded border-[var(--theme-border)]" />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-sm font-semibold text-[var(--theme-primary)] hover:text-[var(--theme-primary-hover)]">
              Forgot Password?
            </Link>
          </div>

          {error && <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm font-medium text-[var(--theme-danger)]">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Logging in...' : 'Login'}
          </Button>

          <GoogleAuthButton label="Continue with Google" onError={setError} />
        </form>

        <p className="mt-6 text-center text-sm text-[var(--theme-secondary-text)]">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-[var(--theme-primary)] hover:text-[var(--theme-primary-hover)]">
            Register
          </Link>
        </p>
      </section>
    </div>
  );
}

export default LoginPage;
