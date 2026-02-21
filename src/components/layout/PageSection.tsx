import type { ReactNode } from 'react';

interface PageSectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function PageSection({ title, children, className = '' }: PageSectionProps) {
  return (
    <section className={`mb-6 ${className}`}>
      {title && (
        <h2 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-3">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
