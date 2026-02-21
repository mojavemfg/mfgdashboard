import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

/* ─── Shared field wrapper ────────────────────────────────────────────────── */

interface FieldProps {
  label?: string;
  helper?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, helper, error, children, className = '' }: FieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-medium text-[var(--color-text-secondary)]">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-[var(--color-danger)]">{error}</p>
      ) : helper ? (
        <p className="text-xs text-[var(--color-text-tertiary)]">{helper}</p>
      ) : null}
    </div>
  );
}

/* ─── Shared input classes ────────────────────────────────────────────────── */

const baseInput =
  'h-8 w-full rounded-[var(--radius-md)] border px-3 text-sm ' +
  'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] ' +
  'bg-[var(--color-bg)] ' +
  'transition-[border-color,box-shadow] duration-150 ' +
  'focus:outline-none ' +
  'disabled:bg-[var(--color-bg-muted)] disabled:cursor-not-allowed disabled:opacity-60';

const normalBorder = 'border-[var(--color-border)]';
const focusNormal  = 'focus:border-[var(--color-brand)] focus:shadow-[0_0_0_3px_var(--color-brand-subtle)]';
const errorBorder  = 'border-[var(--color-danger)]';
const focusError   = 'focus:border-[var(--color-danger)] focus:shadow-[0_0_0_3px_var(--color-danger-subtle)]';

/* ─── Input ───────────────────────────────────────────────────────────────── */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({ error = false, className = '', ...props }: InputProps) {
  return (
    <input
      {...props}
      className={[
        baseInput,
        error ? `${errorBorder} ${focusError}` : `${normalBorder} ${focusNormal}`,
        className,
      ].join(' ')}
    />
  );
}

/* ─── Textarea ────────────────────────────────────────────────────────────── */

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function Textarea({ error = false, className = '', ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      className={[
        'w-full min-h-20 rounded-[var(--radius-md)] border px-3 py-2 text-sm',
        'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]',
        'bg-[var(--color-bg)] resize-y',
        'transition-[border-color,box-shadow] duration-150',
        'focus:outline-none',
        'disabled:bg-[var(--color-bg-muted)] disabled:cursor-not-allowed disabled:opacity-60',
        error ? `${errorBorder} ${focusError}` : `${normalBorder} ${focusNormal}`,
        className,
      ].join(' ')}
    />
  );
}

/* ─── Select ──────────────────────────────────────────────────────────────── */

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export function Select({ error = false, className = '', children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        {...props}
        className={[
          baseInput,
          'appearance-none pr-8 cursor-pointer',
          error ? `${errorBorder} ${focusError}` : `${normalBorder} ${focusNormal}`,
          className,
        ].join(' ')}
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none"
      />
    </div>
  );
}
