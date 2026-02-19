import type { ReactNode } from 'react';

interface PageSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function PageSection({ title, children, className = '' }: PageSectionProps) {
  return (
    <section className={`mb-5 sm:mb-7 ${className}`}>
      <h2 className="text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-widest mb-3">{title}</h2>
      {children}
    </section>
  );
}
