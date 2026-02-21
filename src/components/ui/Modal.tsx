import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-md',
}: ModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/*
        Desktop/tablet: centered dialog
        Mobile: bottom sheet that slides up
      */}

      {/* Desktop + tablet panel (md+) */}
      <div className="hidden md:flex items-center justify-center p-4 h-full pointer-events-none">
        <div
          className={[
            'relative w-full bg-[var(--color-bg)] pointer-events-auto',
            'border border-[var(--color-border)] rounded-[var(--radius-xl)]',
            'shadow-[var(--shadow-md)] animate-modal-in',
            'max-h-[90vh] flex flex-col',
            maxWidth,
          ].join(' ')}
        >
          <ModalInner title={title} onClose={onClose} footer={footer}>
            {children}
          </ModalInner>
        </div>
      </div>

      {/* Mobile bottom sheet (< md) */}
      <div className="md:hidden absolute inset-x-0 bottom-0 pointer-events-auto">
        <div
          className={[
            'relative w-full bg-[var(--color-bg)]',
            'rounded-t-[var(--radius-xl)] rounded-b-none',
            'border-t border-l border-r border-[var(--color-border)]',
            'shadow-[var(--shadow-md)] animate-sheet-up',
            'max-h-[90vh] flex flex-col',
          ].join(' ')}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-9 h-1 rounded-full bg-[var(--color-border-strong)]" />
          </div>
          <ModalInner title={title} onClose={onClose} footer={footer}>
            {children}
          </ModalInner>
        </div>
      </div>
    </div>
  );
}

function ModalInner({
  title,
  onClose,
  children,
  footer,
}: {
  title?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <>
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] shrink-0">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h2>
          <button
            onClick={onClose}
            className={[
              'p-1 rounded-[var(--radius-md)] text-[var(--color-text-tertiary)]',
              'hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)]',
              'transition-colors duration-150 focus-visible:outline-none',
              'focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]',
            ].join(' ')}
            aria-label="Close"
          >
            <X size={16} />
          </button>
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
    </>
  );
}
