import { useState, type FormEvent } from 'react';
import { Navigate, Link } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { AuthDivider } from '@/components/auth/AuthDivider';

function friendlySignUpError(err: unknown): string {
  const msg = err instanceof Error ? err.message : '';
  if (msg.includes('email-already-in-use'))
    return 'An account with this email already exists';
  if (msg.includes('weak-password'))
    return 'Password is too weak. Use at least 8 characters with a mix of letters and numbers.';
  if (msg.includes('invalid-email'))
    return 'Please enter a valid email address';
  if (msg.includes('network-request-failed'))
    return 'Network error. Check your connection.';
  return 'Sign up failed. Please try again.';
}

export function SignUpPage() {
  const { user, signUp, signInWithGoogle, signInWithApple } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!agreedToTerms) {
      setError('Please agree to the Terms & Privacy Policy');
      return;
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must be at least 8 characters with letters and numbers');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signUp(email, password, fullName);
    } catch (err: unknown) {
      setError(friendlySignUpError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(fn: () => Promise<void>) {
    setError('');
    setLoading(true);
    try {
      await fn();
    } catch (err: unknown) {
      setError(friendlySignUpError(err));
    } finally {
      setLoading(false);
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
          Create your account
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Provide your full name, email, and password to create your account and get started.
        </p>
      </div>

      <OAuthButtons
        onGoogle={() => handleOAuth(signInWithGoogle)}
        onApple={() => handleOAuth(signInWithApple)}
        disabled={loading}
      />

      <AuthDivider />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
            required
            className={inputCls}
          />
        </div>

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
              placeholder="Create a password"
              required
              minLength={8}
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

        {/* Terms toggle */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <button
            type="button"
            role="switch"
            aria-checked={agreedToTerms}
            onClick={() => setAgreedToTerms((v) => !v)}
            className={[
              'relative w-10 h-[22px] rounded-[var(--radius-full)] transition-colors duration-200 shrink-0',
              agreedToTerms ? 'bg-[var(--color-text-primary)]' : 'bg-[var(--color-border-strong)]',
            ].join(' ')}
          >
            <span
              className={[
                'absolute top-[2px] left-[2px] w-[18px] h-[18px] rounded-[var(--radius-full)] bg-white transition-transform duration-200',
                agreedToTerms ? 'translate-x-[18px]' : '',
              ].join(' ')}
            />
          </button>
          <span className="text-sm text-[var(--color-text-secondary)]">
            I agree to the{' '}
            <span className="font-semibold text-[var(--color-text-primary)]">Terms</span>
            {' & '}
            <span className="font-semibold text-[var(--color-text-primary)]">Privacy Policy</span>
          </span>
        </label>

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
          {loading ? 'Creating account\u2026' : 'Sign Up'}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--color-text-secondary)] mt-8">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-[var(--color-text-primary)] hover:underline">
          Sign In
        </Link>
      </p>
    </AuthLayout>
  );
}
