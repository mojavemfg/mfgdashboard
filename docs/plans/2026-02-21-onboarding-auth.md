# Onboarding & Authentication Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Firebase Auth with email/password and Google/Apple OAuth, react-router for URL-based routing, and standalone sign-in/sign-up pages matching the screenshot design.

**Architecture:** Standalone auth pages at `/login` and `/signup` with a separate layout from the dashboard. A `ProtectedRoute` wrapper redirects unauthenticated users. `AuthContext` provides user state and auth methods app-wide. The existing `App.tsx` becomes the authenticated dashboard layout with minimal changes.

**Tech Stack:** Firebase Auth, react-router v7, React 19, TypeScript, Tailwind v4, existing design token system

---

### Task 1: Install Dependencies

**Step 1: Install firebase and react-router**

Run:
```bash
npm install firebase react-router
```

**Step 2: Verify install**

Run:
```bash
npm ls firebase react-router
```

Expected: both packages listed with versions

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add firebase and react-router dependencies"
```

---

### Task 2: Firebase Configuration

**Files:**
- Create: `src/lib/firebase.ts`

**Step 1: Create Firebase config and Auth instance**

```typescript
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');
```

**Step 2: Create `.env.local` with placeholder values**

Create `.env.local` at project root:
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

**Step 3: Add `.env.local` to `.gitignore` if not already there**

Check `.gitignore` for `*.local` or `.env.local`. Add if missing:
```
.env.local
```

**Step 4: Add Vite env type declarations**

Create or update `src/vite-env.d.ts`:
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
}
```

**Step 5: Verify build**

Run:
```bash
npm run build
```

Expected: successful build (Firebase just imports, no runtime calls yet)

**Step 6: Commit**

```bash
git add src/lib/firebase.ts src/vite-env.d.ts .gitignore
git commit -m "feat: add Firebase configuration and env setup"
```

---

### Task 3: Auth Context

**Files:**
- Create: `src/contexts/AuthContext.tsx`

**Step 1: Create AuthContext with all auth methods**

This is the central auth provider. It wraps the app and exposes user state + auth functions.

```typescript
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth, googleProvider, appleProvider } from '@/lib/firebase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(newUser, { displayName: fullName });
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    await signInWithPopup(auth, googleProvider);
  }, []);

  const handleAppleSignIn = useCallback(async () => {
    await signInWithPopup(auth, appleProvider);
  }, []);

  const handleSignOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signInWithGoogle: handleGoogleSignIn,
        signInWithApple: handleAppleSignIn,
        signOut: handleSignOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: successful build

**Step 3: Commit**

```bash
git add src/contexts/AuthContext.tsx
git commit -m "feat: add AuthContext with Firebase auth methods"
```

---

### Task 4: Auth UI Components

**Files:**
- Create: `src/components/auth/AuthLayout.tsx`
- Create: `src/components/auth/OAuthButtons.tsx`
- Create: `src/components/auth/AuthDivider.tsx`

**Step 1: Create AuthLayout — the centered card wrapper**

This wraps sign-in and sign-up pages in a centered, responsive container.

```typescript
import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-[var(--color-bg)] px-4 py-8">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
```

**Step 2: Create OAuthButtons — Google + Apple side by side**

Matching the screenshot: outlined buttons with provider icons, side by side.

```typescript
interface OAuthButtonsProps {
  onGoogle: () => void;
  onApple: () => void;
  disabled?: boolean;
}

export function OAuthButtons({ onGoogle, onApple, disabled }: OAuthButtonsProps) {
  const btnCls = [
    'flex-1 h-11 flex items-center justify-center gap-2.5',
    'rounded-[var(--radius-full)] border border-[var(--color-border)]',
    'bg-[var(--color-bg)] text-sm font-medium text-[var(--color-text-primary)]',
    'hover:bg-[var(--color-bg-muted)] transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'cursor-pointer',
  ].join(' ');

  return (
    <div className="flex gap-3">
      <button onClick={onGoogle} disabled={disabled} className={btnCls} type="button">
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Google
      </button>
      <button onClick={onApple} disabled={disabled} className={btnCls} type="button">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
        </svg>
        Apple
      </button>
    </div>
  );
}
```

**Step 3: Create AuthDivider — "or" separator**

```typescript
export function AuthDivider() {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px bg-[var(--color-border)]" />
      <span className="text-xs text-[var(--color-text-tertiary)]">or</span>
      <div className="flex-1 h-px bg-[var(--color-border)]" />
    </div>
  );
}
```

**Step 4: Verify build**

Run: `npm run build`

**Step 5: Commit**

```bash
git add src/components/auth/
git commit -m "feat: add auth UI components (AuthLayout, OAuthButtons, AuthDivider)"
```

---

### Task 5: Sign Up Page

**Files:**
- Create: `src/pages/SignUpPage.tsx`

**Step 1: Build the full sign-up page**

This matches the left screen in the screenshot: "Create your account" with full name, email, password fields, OAuth buttons, terms toggle, and a link to sign in.

```typescript
import { useState, type FormEvent } from 'react';
import { Navigate, Link } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { AuthDivider } from '@/components/auth/AuthDivider';

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
    setError('');
    setLoading(true);
    try {
      await signUp(email, password, fullName);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
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
      setError(err instanceof Error ? err.message : 'Sign in failed');
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
              minLength={6}
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
          {loading ? 'Creating account…' : 'Sign Up'}
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
```

**Step 2: Verify build**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/pages/SignUpPage.tsx
git commit -m "feat: add sign-up page with email/password and OAuth"
```

---

### Task 6: Sign In Page

**Files:**
- Create: `src/pages/SignInPage.tsx`

**Step 1: Build the sign-in page**

Matches the right screen in the screenshot: "Welcome Back" with email, password, remember me, forgot password, and link to sign up.

```typescript
import { useState, type FormEvent } from 'react';
import { Navigate, Link } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { AuthDivider } from '@/components/auth/AuthDivider';

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
      await signIn(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
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
      setError(err instanceof Error ? err.message : 'Sign in failed');
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not send reset email');
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
          {loading ? 'Signing in…' : 'Sign In'}
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
```

**Step 2: Verify build**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/pages/SignInPage.tsx
git commit -m "feat: add sign-in page with email/password, OAuth, and forgot password"
```

---

### Task 7: Protected Route & Router

**Files:**
- Create: `src/components/auth/ProtectedRoute.tsx`
- Create: `src/router.tsx`

**Step 1: Create ProtectedRoute component**

Redirects unauthenticated users to `/login`. Shows a full-screen spinner while Firebase resolves auth state.

```typescript
import { Navigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-[var(--color-bg)]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
```

**Step 2: Create the router configuration**

```typescript
import { createBrowserRouter } from 'react-router';
import App from '@/App';
import { SignInPage } from '@/pages/SignInPage';
import { SignUpPage } from '@/pages/SignUpPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <SignInPage />,
  },
  {
    path: '/signup',
    element: <SignUpPage />,
  },
  {
    path: '/*',
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
  },
]);
```

**Step 3: Verify build**

Run: `npm run build`

**Step 4: Commit**

```bash
git add src/components/auth/ProtectedRoute.tsx src/router.tsx
git commit -m "feat: add ProtectedRoute and router configuration"
```

---

### Task 8: Wire Up main.tsx and Header Sign-Out

**Files:**
- Modify: `src/main.tsx`
- Modify: `src/components/layout/Header.tsx`

**Step 1: Update `src/main.tsx` to use AuthProvider + RouterProvider**

Replace the entire contents of `main.tsx`:

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import { router } from '@/router';
import './styles/tokens.css';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AuthProvider>
  </StrictMode>,
);
```

**Step 2: Update `App.tsx` to remove the duplicate `ToastProvider`**

In `src/App.tsx`, the outer `<ToastProvider>` wrapper must be removed since it's now in `main.tsx`. Change the return statement:

From:
```tsx
return (
  <ToastProvider>
    <div className="h-dvh flex flex-col ...">
      ...
    </div>
  </ToastProvider>
);
```

To:
```tsx
return (
  <div className="h-dvh flex flex-col bg-[var(--color-bg)] text-[var(--color-text-primary)] overflow-hidden">
    <Header ... />
    <div className="flex flex-1 overflow-hidden">
      <Sidebar ... />
      <Dashboard ... />
    </div>
  </div>
);
```

Also remove the `ToastProvider` import from `App.tsx`.

**Step 3: Wire up Header sign-out button**

In `src/components/layout/Header.tsx`:

1. Import `useAuth`:
```typescript
import { useAuth } from '@/contexts/AuthContext';
```

2. Inside the `Header` component, destructure signOut and user:
```typescript
const { signOut, user } = useAuth();
```

3. Update the avatar button to show user initials:
```tsx
{(user?.displayName?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase()}
```

4. Wire the Sign Out button's onClick:
```tsx
<button
  onClick={signOut}
  className="flex items-center gap-2 w-full px-3 py-2 text-sm ..."
>
  <LogOut size={14} />
  Sign Out
</button>
```

**Step 4: Verify build**

Run: `npm run build`

**Step 5: Test manually**

Run: `npm run dev`

Expected behavior:
- Navigate to `http://localhost:5173/` → redirected to `/login`
- Sign-in page renders with "Welcome Back" heading
- Click "Sign Up" link → navigates to `/signup`
- Sign-up page renders with "Create your account" heading
- Both pages show Google + Apple OAuth buttons
- Both pages have properly styled form inputs with password visibility toggles

**Step 6: Commit**

```bash
git add src/main.tsx src/App.tsx src/components/layout/Header.tsx
git commit -m "feat: wire auth into app with routing, protected routes, and header sign-out"
```

---

### Task 9: Firebase Project Setup (User Action)

This task requires the user to configure their Firebase project.

**Step 1: Create or select a Firebase project**

Use the Firebase MCP tools or the [Firebase Console](https://console.firebase.google.com) to:
1. Create a project (or use an existing one)
2. Enable **Authentication** in the Firebase console
3. Enable sign-in methods: **Email/Password**, **Google**, **Apple**
4. Register a **Web app** and copy the config values

**Step 2: Populate `.env.local`**

Update `.env.local` with real Firebase config values from the console.

**Step 3: Test the full flow**

Run: `npm run dev`

1. Go to `/signup` → fill in name, email, password → click Sign Up → should land on dashboard
2. Click avatar → Sign Out → should redirect to `/login`
3. Go to `/login` → enter email + password → Sign In → should land on dashboard
4. Test Google OAuth button (requires Google sign-in method enabled in Firebase)

---

### Task 10: Add SPA Fallback for Vite Dev Server

**Files:**
- Check: `vite.config.ts` (Vite dev server handles SPA fallback by default, but verify for production)

**Step 1: Add Vercel SPA rewrite if deploying to Vercel**

If the project is deployed to Vercel, create/update `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

This ensures that `/login`, `/signup`, and all other routes are handled by the SPA.

**Step 2: Commit if changes were made**

```bash
git add vercel.json
git commit -m "chore: add Vercel SPA rewrites for client-side routing"
```
