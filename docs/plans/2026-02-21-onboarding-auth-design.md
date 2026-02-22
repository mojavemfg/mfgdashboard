# Onboarding & Authentication Design

## Decisions

- **Auth backend**: Firebase Auth
- **Routing**: react-router v7 (BrowserRouter)
- **Email verification**: Immediate access (no email verification required)
- **UI approach**: Standalone auth pages, separate layout from dashboard

## Architecture

### Firebase Setup

- `src/lib/firebase.ts` — Firebase app init + Auth instance
- Google and Apple OAuth providers configured
- Email/password auth enabled

### Auth Context

`src/contexts/AuthContext.tsx` provides:

- `user: User | null`
- `loading: boolean` (true while Firebase resolves auth state)
- `signUp(email, password, fullName)` — createUserWithEmailAndPassword + updateProfile
- `signIn(email, password)` — signInWithEmailAndPassword
- `signInWithGoogle()` — signInWithPopup(GoogleAuthProvider)
- `signInWithApple()` — signInWithPopup(OAuthProvider('apple.com'))
- `signOut()`
- `resetPassword(email)` — sendPasswordResetEmail

### Routing

```
/login    → SignInPage (public, redirects to / if authenticated)
/signup   → SignUpPage (public, redirects to / if authenticated)
/         → ProtectedRoute → DashboardLayout (existing App.tsx content)
```

### New Files

```
src/lib/firebase.ts
src/contexts/AuthContext.tsx
src/components/auth/AuthLayout.tsx        — centered card wrapper
src/components/auth/OAuthButtons.tsx      — Google + Apple buttons
src/components/auth/AuthDivider.tsx       — "or" divider line
src/pages/SignUpPage.tsx
src/pages/SignInPage.tsx
src/components/auth/ProtectedRoute.tsx
src/router.tsx                            — createBrowserRouter config
```

### Modified Files

- `src/main.tsx` — wrap in AuthProvider + RouterProvider
- `src/App.tsx` — becomes dashboard layout component (minimal changes)

## UI Design

### Sign Up Page

1. Centered card (max-w-md), white bg / dark bg
2. "Create your account" h1 + subtitle
3. Google + Apple OAuth buttons (outlined, side by side)
4. "or" divider
5. Full Name field
6. Email Address field
7. Password field with visibility toggle
8. Terms & Privacy toggle
9. Full-width "Sign Up" button (dark/black fill)
10. "Already have an account? Sign In" link

### Sign In Page

1. Same layout
2. "Welcome Back" h1 + subtitle
3. Google + Apple OAuth buttons
4. "or" divider
5. Email Address field
6. Password field with visibility toggle
7. "Remember me" toggle + "Forgot Password?" link
8. Full-width "Sign In" button (dark/black fill)
9. "Don't have an account? Sign Up" link

### Styling

- Reuse existing design tokens and UI components (Button, Input, Field)
- Dark mode support via existing token system
- Responsive: centered card on desktop, full-width on mobile

## Forgot Password

- "Forgot Password?" link on sign-in page
- Calls `sendPasswordResetEmail()` from Firebase
- Shows toast "Reset link sent to your email"
- No separate page needed
