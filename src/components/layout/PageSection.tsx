import type { ReactNode } from 'react';

interface PageSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function PageSection({ title, children, className = '' }: PageSectionProps) {
  return (
    <section className={`mb-6 ${className}`}>
      <h2 className="text-slate-200 font-semibold text-base mb-3">{title}</h2>
      {children}
    </section>
  );
}
