import { useState, type FormEvent } from 'react';
import { Navigate, Link } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import { browserLocalPersistence, browserSessionPersistence, setPersistence } from 'firebase/auth';
import { auth as firebaseAuth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { AuthDivider } from '@/components/auth/AuthDivider';

function friendlyAuthError(err: unknown): string {
  const msg = err instanceof Error ? err.message : '';
  if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential'))
    return 'Invalid email or password';
  if (msg.includes('too-many-requests'))
    return 'Too many attempts. Please try again later.';
  if (msg.includes('network-request-failed'))
    return 'Network error. Check your connection.';
  return 'Sign in failed. Please try again.';
}

export function SignInPage() {
  const { user, signIn, signInWithGoogle, signInWithApple, resetPassword } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await setPersistence(firebaseAuth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      await signIn(email, password);
    } catch (err: unknown) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(fn: () => Promise<void>) {
    setError('');
    setLoading(true);
    try {
      await setPersistence(firebaseAuth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      await fn();
    } catch (err: unknown) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setError('Enter your email address first');
      return;
    }
    try {
      await resetPassword(email);
      toast('Reset link sent to your email', 'success');
    } catch {
      setError('Could not send reset email. Check the address and try again.');
    }
  }

  const inputCls = [
    'w-full h-12 rounded-[var(--radius-full)] border border-[var(--color-border)]',
    'bg-[var(--color-bg-subtle)] px-4 text-sm text-[var(--color-text-primary)]',
    'placeholder:text-[var(--color-text-tertiary)]',
    'focus:outline-none focus:border-[var(--color-brand)] focus:shadow-[0_0_0_3px_var(--color-brand-subtle)]',
    'transition-[border-color,box-shadow] duration-150',
  ].join(' ');

  return (
    <AuthLayout>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
          Welcome Back
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Stay connected by signing in with your email and password to access your account.
        </p>
      </div>

      <OAuthButtons
        onGoogle={() => handleOAuth(signInWithGoogle)}
        onApple={() => handleOAuth(signInWithApple)}
        disabled={loading}
      />

      <AuthDivider />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className={inputCls}
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Remember me + Forgot password row */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <button
              type="button"
              role="switch"
              aria-checked={rememberMe}
              onClick={() => setRememberMe((v) => !v)}
              className={[
                'relative w-10 h-[22px] rounded-[var(--radius-full)] transition-colors duration-200 shrink-0',
                rememberMe ? 'bg-[var(--color-text-primary)]' : 'bg-[var(--color-border-strong)]',
              ].join(' ')}
            >
              <span
                className={[
                  'absolute top-[2px] left-[2px] w-[18px] h-[18px] rounded-[var(--radius-full)] bg-white transition-transform duration-200',
                  rememberMe ? 'translate-x-[18px]' : '',
                ].join(' ')}
              />
            </button>
            <span className="text-sm text-[var(--color-text-secondary)]">Remember me</span>
          </label>

          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm font-semibold text-[var(--color-text-primary)] hover:underline"
          >
            Forgot Password?
          </button>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-sm text-[var(--color-danger)] text-center">{error}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className={[
            'w-full h-12 rounded-[var(--radius-full)] font-semibold text-sm transition-colors duration-150',
            'bg-[var(--color-text-primary)] text-[var(--color-bg)]',
            'hover:opacity-90 cursor-pointer',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          ].join(' ')}
        >
          {loading ? 'Signing in\u2026' : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--color-text-secondary)] mt-8">
        Don't have an account?{' '}
        <Link to="/signup" className="font-semibold text-[var(--color-text-primary)] hover:underline">
          Sign Up
        </Link>
      </p>
    </AuthLayout>
  );
}
