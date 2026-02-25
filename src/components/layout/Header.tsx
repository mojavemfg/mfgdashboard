import { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, Sun, Moon, Menu, LogOut, AlertOctagon, AlertTriangle, ShoppingBag, CheckCircle2 } from 'lucide-react';
import type { View } from '@/App';
import { useAuth } from '@/contexts/AuthContext';

export interface NotificationAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  detail: string;
  view: View;
}

interface HeaderProps {
  alerts: NotificationAlert[];
  isDark: boolean;
  onThemeToggle: () => void;
  pageTitle?: string;
  onMobileMenuOpen?: () => void;
  onNavigate?: (view: View) => void;
}

// Shared hook for click-outside + Escape dismiss.
// Returns [open, setOpen, callbackRef] as a tuple to avoid
// the react-hooks/refs lint rule flagging property access on
// an object that contains a ref.
function useDropdown(): [boolean, React.Dispatch<React.SetStateAction<boolean>>, (node: HTMLDivElement | null) => void] {
  const [open, setOpen] = useState(false);
  const elRef = useRef<HTMLDivElement | null>(null);

  const callbackRef = useCallback((node: HTMLDivElement | null) => {
    elRef.current = node;
  }, []);

  useEffect(() => {
    if (!open) return;
    const onMouse = (e: MouseEvent) => {
      if (elRef.current && !elRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
    };
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouse);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return [open, setOpen, callbackRef];
}

const severityIcon = {
  critical: <AlertOctagon size={13} className="text-[var(--color-danger)] shrink-0 mt-0.5" />,
  warning:  <AlertTriangle size={13} className="text-[var(--color-warning)] shrink-0 mt-0.5" />,
  info:     <ShoppingBag size={13} className="text-[var(--color-info)] shrink-0 mt-0.5" />,
};


export function Header({
  alerts,
  isDark,
  onThemeToggle,
  pageTitle = 'Dashboard',
  onMobileMenuOpen,
  onNavigate,
}: HeaderProps) {
  const { signOut, user } = useAuth();
  const [bellOpen, setBellOpen, bellRef]       = useDropdown();
  const [avatarOpen, setAvatarOpen, avatarRef] = useDropdown();

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const totalCount    = alerts.length;

  // Group alerts by severity for the dropdown
  const criticals = alerts.filter(a => a.severity === 'critical');
  const warnings  = alerts.filter(a => a.severity === 'warning');
  const infos     = alerts.filter(a => a.severity === 'info');

  const iconBtn = [
    'p-2 rounded-[var(--radius-md)] transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]',
  ].join(' ');

  function handleAlertClick(view: View) {
    onNavigate?.(view);
    setBellOpen(false);
  }

  return (
    <header
      className={[
        'h-12 flex items-center justify-between px-4 lg:px-6 shrink-0',
        'border-b border-[var(--color-border)] bg-[var(--color-bg)]',
      ].join(' ')}
    >
      {/* Left: hamburger (mobile/tablet) + page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuOpen}
          className={[
            'lg:hidden -ml-1 p-1.5 rounded-[var(--radius-md)] text-[var(--color-text-secondary)]',
            'hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)]',
            'transition-colors duration-150 focus-visible:outline-none',
            'focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]',
          ].join(' ')}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <span className="text-sm lg:text-base font-semibold text-[var(--color-text-primary)]">
          {pageTitle}
        </span>
      </div>

      {/* Right: theme toggle + bell + avatar */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <button
          onClick={onThemeToggle}
          aria-label="Toggle theme"
          className={[
            iconBtn,
            'text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)]',
          ].join(' ')}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notification bell + dropdown */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => setBellOpen(v => !v)}
            aria-label="Notifications"
            aria-haspopup="true"
            aria-expanded={bellOpen}
            className={[
              iconBtn,
              criticalCount > 0
                ? 'text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)]'
                : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)]',
            ].join(' ')}
          >
            <Bell size={16} />
          </button>

          {/* Badge */}
          {totalCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-[var(--color-danger)] text-white text-[9px] font-bold rounded-[var(--radius-full)] flex items-center justify-center pointer-events-none">
              {totalCount}
            </span>
          )}

          {/* Notification dropdown panel */}
          {bellOpen && (
            <div className="absolute right-0 top-full mt-1 w-80 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] z-50 overflow-hidden animate-modal-in">
              {/* Header row */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">Notifications</span>
                {totalCount > 0 && (
                  <span className="text-xs text-[var(--color-text-tertiary)]">{totalCount} active</span>
                )}
              </div>

              {/* Alert list */}
              <div className="max-h-[360px] overflow-y-auto">
                {totalCount === 0 ? (
                  <div className="flex items-center gap-2.5 px-4 py-5">
                    <CheckCircle2 size={16} className="text-[var(--color-success)] shrink-0" />
                    <span className="text-sm text-[var(--color-success)] font-medium">All clear — no active alerts</span>
                  </div>
                ) : (
                  <>
                    {/* Critical group */}
                    {criticals.length > 0 && (
                      <AlertGroup
                        label="Critical"
                        labelCls="text-[var(--color-danger)]"
                        items={criticals}
                        onNavigate={handleAlertClick}
                      />
                    )}
                    {/* Warning group */}
                    {warnings.length > 0 && (
                      <AlertGroup
                        label="Warning"
                        labelCls="text-[var(--color-warning)]"
                        items={warnings}
                        onNavigate={handleAlertClick}
                      />
                    )}
                    {/* Info group */}
                    {infos.length > 0 && (
                      <AlertGroup
                        label="Orders"
                        labelCls="text-[var(--color-info)]"
                        items={infos}
                        onNavigate={handleAlertClick}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Footer link */}
              {totalCount > 0 && (
                <div className="border-t border-[var(--color-border)]">
                  <button
                    onClick={() => handleAlertClick('inventory')}
                    className="w-full px-4 py-2.5 text-xs font-medium text-[var(--color-brand)] hover:bg-[var(--color-bg-subtle)] transition-colors text-left"
                  >
                    View all in Inventory →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Avatar with dropdown */}
        <div ref={avatarRef} className="relative ml-1">
          <button
            onClick={() => setAvatarOpen(v => !v)}
            aria-label="User menu"
            aria-haspopup="menu"
            aria-expanded={avatarOpen}
            className={[
              'w-7 h-7 rounded-[var(--radius-full)] bg-[var(--color-bg-muted)]',
              'border border-[var(--color-border)] flex items-center justify-center',
              'text-xs font-medium text-[var(--color-text-secondary)]',
              'hover:border-[var(--color-border-strong)] transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]',
              'cursor-pointer',
            ].join(' ')}
          >
            {(user?.displayName?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase()}
          </button>

          {avatarOpen && (
            <div className="absolute right-0 top-full mt-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] py-1 min-w-[160px] z-50">
              <button onClick={signOut} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-primary)] transition-colors">
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function AlertGroup({
  label,
  labelCls,
  items,
  onNavigate,
}: {
  label: string;
  labelCls: string;
  items: NotificationAlert[];
  onNavigate: (view: View) => void;
}) {
  return (
    <div>
      <div className={`px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest ${labelCls}`}>
        {label} · {items.length}
      </div>
      {items.map((alert) => (
        <button
          key={alert.id}
          onClick={() => onNavigate(alert.view)}
          className="w-full flex items-start gap-2.5 px-4 py-2.5 text-left hover:bg-[var(--color-bg-subtle)] transition-colors duration-100"
        >
          {severityIcon[alert.severity]}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[var(--color-text-primary)] truncate leading-snug">
              {alert.title}
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5 truncate">
              {alert.detail}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
