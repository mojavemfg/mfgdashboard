import type { ReactNode } from 'react';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  children: ReactNode;
  shadow?: boolean;
  padding?: CardPadding;
  className?: string;
}

const paddingMap: Record<CardPadding, string> = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-6',
};

export function Card({ children, shadow = false, padding = 'md', className = '' }: CardProps) {
  return (
    <div
      className={[
        'bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-lg)]',
        shadow ? 'shadow-[var(--shadow-sm)]' : '',
        paddingMap[padding],
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div
      className={[
        'pb-4 mb-4 border-b border-[var(--color-border)]',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div
      className={[
        'pt-4 mt-4 border-t border-[var(--color-border)] flex items-center justify-end gap-2',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}
