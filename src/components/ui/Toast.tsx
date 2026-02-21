import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

/* ─── Types ───────────────────────────────────────────────────────────────── */

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

/* ─── Context ─────────────────────────────────────────────────────────────── */

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

/* ─── Icon & accent bar per type ─────────────────────────────────────────── */

const typeConfig: Record<ToastType, { icon: ReactNode; barColor: string; iconColor: string }> = {
  success: {
    icon: <CheckCircle2 size={16} />,
    barColor: 'bg-[var(--color-success)]',
    iconColor: 'text-[var(--color-success)]',
  },
  error: {
    icon: <AlertCircle size={16} />,
    barColor: 'bg-[var(--color-danger)]',
    iconColor: 'text-[var(--color-danger)]',
  },
  warning: {
    icon: <AlertTriangle size={16} />,
    barColor: 'bg-[var(--color-warning)]',
    iconColor: 'text-[var(--color-warning)]',
  },
  info: {
    icon: <Info size={16} />,
    barColor: 'bg-[var(--color-brand)]',
    iconColor: 'text-[var(--color-brand)]',
  },
};

/* ─── Individual toast ────────────────────────────────────────────────────── */

function ToastItem({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const { icon, barColor, iconColor } = typeConfig[item.type];

  return (
    <div
      className={[
        'group relative flex items-start gap-3 max-w-sm w-full',
        'bg-[var(--color-bg)] border border-[var(--color-border)]',
        'rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]',
        'px-4 py-3 overflow-hidden',
        'animate-toast-in',
      ].join(' ')}
      role="alert"
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${barColor}`} />

      {/* Icon */}
      <span className={`shrink-0 mt-0.5 ${iconColor}`}>{icon}</span>

      {/* Message */}
      <p className="flex-1 text-sm text-[var(--color-text-primary)] leading-snug pr-2">
        {item.message}
      </p>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(item.id)}
        className={[
          'shrink-0 -mr-1 p-0.5 rounded text-[var(--color-text-tertiary)]',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          'hover:text-[var(--color-text-primary)]',
        ].join(' ')}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-border)]">
        <div
          className={`h-full ${barColor} opacity-40 animate-progress-shrink`}
          style={{ animationDuration: '4s' }}
        />
      </div>
    </div>
  );
}

/* ─── Provider ────────────────────────────────────────────────────────────── */

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => dismiss(id), 4200);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast stack — bottom-right */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((item) => (
          <div key={item.id} className="pointer-events-auto">
            <ToastItem item={item} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
