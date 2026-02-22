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
