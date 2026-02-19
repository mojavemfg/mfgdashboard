import type { ReactNode } from 'react';

interface PageSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function PageSection({ title, children, className = '' }: PageSectionProps) {
  return (
    <section className={`mb-5 sm:mb-7 ${className}`}>
      <h2 className="text-slate-300 font-semibold text-sm uppercase tracking-wider mb-3">{title}</h2>
      {children}
    </section>
  );
}
