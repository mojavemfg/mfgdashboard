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

// eslint-disable-next-line react-refresh/only-export-components
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
    // Clear user-specific data to prevent data leakage between accounts
    const keysToRemove = [
      'mfg_settings', 'mfg-print-inventory', 'salesmap_orders',
      'margin_filament_library', 'margin_presets',
      'anthropic_api_key', 'google_api_key', 'openai_api_key',
    ];
    keysToRemove.forEach((k) => localStorage.removeItem(k));
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
