import { useEffect, type ReactNode } from 'react';
import { X, ArrowLeft } from 'lucide-react';

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function SlideOver({ open, onClose, title, children, footer }: SlideOverProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/*
        Mobile (< md): full-width panel — feels native
        Tablet (768–1023px): 360px panel from right
        Desktop (1024px+): 400px panel from right
      */}
      <div
        className={[
          'relative w-full md:w-[360px] lg:w-[400px]',
          'bg-[var(--color-bg)] border-l border-[var(--color-border)]',
          'flex flex-col h-full',
          'animate-slideover-in',
        ].join(' ')}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-border)] shrink-0">
            {/* Mobile: back arrow; tablet+: X close button */}
            <button
              onClick={onClose}
              className={[
                'p-1 rounded-[var(--radius-md)] text-[var(--color-text-tertiary)]',
                'hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)]',
                'transition-colors duration-150 focus-visible:outline-none',
                'focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]',
              ].join(' ')}
              aria-label="Go back"
            >
              <ArrowLeft size={16} className="md:hidden" />
              <X size={16} className="hidden md:block" />
            </button>
            <h2 className="text-base font-semibold text-[var(--color-text-primary)] flex-1">{title}</h2>
          </div>
        )}

        {/* Body */}
        <div className="px-5 py-4 overflow-y-auto flex-1">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 py-4 border-t border-[var(--color-border)] flex justify-end gap-2 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
