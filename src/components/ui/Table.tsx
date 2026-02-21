import type { ReactNode } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

/* ─── Table container ─────────────────────────────────────────────────────── */

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div
      className={[
        'border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden',
        className,
      ].join(' ')}
    >
      <table className="w-full border-collapse">{children}</table>
    </div>
  );
}

/* ─── Table head ──────────────────────────────────────────────────────────── */

export function Thead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-[var(--color-bg-subtle)]">
      {children}
    </thead>
  );
}

/* ─── Th (sortable-aware) ─────────────────────────────────────────────────── */

type SortDir = 'asc' | 'desc' | null;

interface ThProps {
  children?: ReactNode;
  sortDir?: SortDir;
  onSort?: () => void;
  align?: 'left' | 'center' | 'right';
  width?: string;
  className?: string;
}

export function Th({
  children,
  sortDir,
  onSort,
  align = 'left',
  width,
  className = '',
}: ThProps) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  const sortable = !!onSort;

  return (
    <th
      style={width ? { width } : undefined}
      onClick={sortable ? onSort : undefined}
      className={[
        'h-9 px-4 text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide',
        'border-b border-[var(--color-border)]',
        alignClass,
        sortable ? 'cursor-pointer select-none hover:text-[var(--color-text-secondary)] transition-colors' : '',
        className,
      ].join(' ')}
    >
      {sortable ? (
        <span className="inline-flex items-center gap-1">
          {children}
          {sortDir === 'asc' ? (
            <ChevronUp size={12} className="text-[var(--color-text-primary)]" />
          ) : sortDir === 'desc' ? (
            <ChevronDown size={12} className="text-[var(--color-text-primary)]" />
          ) : (
            <span className="w-3 opacity-0 group-hover:opacity-30">
              <ChevronUp size={12} />
            </span>
          )}
        </span>
      ) : (
        children
      )}
    </th>
  );
}

/* ─── Table body ──────────────────────────────────────────────────────────── */

export function Tbody({ children }: { children: ReactNode }) {
  return <tbody className="bg-[var(--color-bg)]">{children}</tbody>;
}

/* ─── Tr ──────────────────────────────────────────────────────────────────── */

interface TrProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function Tr({ children, onClick, className = '' }: TrProps) {
  return (
    <tr
      onClick={onClick}
      className={[
        'group border-b border-[var(--color-border)] last:border-0',
        'transition-colors duration-100',
        onClick ? 'cursor-pointer hover:bg-[var(--color-bg-subtle)]' : 'hover:bg-[var(--color-bg-subtle)]',
        className,
      ].join(' ')}
    >
      {children}
    </tr>
  );
}

/* ─── Td ──────────────────────────────────────────────────────────────────── */

interface TdProps {
  children?: ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
  mono?: boolean;
}

export function Td({ children, align = 'left', mono = false, className = '' }: TdProps) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <td
      className={[
        'h-11 px-4 text-sm text-[var(--color-text-primary)]',
        alignClass,
        mono ? 'font-mono text-sm' : '',
        className,
      ].join(' ')}
    >
      {children}
    </td>
  );
}

/* ─── Empty state ─────────────────────────────────────────────────────────── */

interface TableEmptyProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  colSpan?: number;
}

export function TableEmpty({ icon, title, description, action, colSpan = 99 }: TableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-16 px-4">
        <div className="flex flex-col items-center text-center">
          {icon && (
            <span className="text-[var(--color-text-tertiary)] mb-3">{icon}</span>
          )}
          <p className="text-sm font-medium text-[var(--color-text-primary)] mt-1">{title}</p>
          {description && (
            <p className="text-sm text-[var(--color-text-tertiary)] mt-1 max-w-xs">{description}</p>
          )}
          {action && <div className="mt-4">{action}</div>}
        </div>
      </td>
    </tr>
  );
}
