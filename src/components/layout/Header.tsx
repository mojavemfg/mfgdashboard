import { useState, useRef, useEffect } from 'react';
import { Bell, Sun, Moon, Menu, Settings, LogOut } from 'lucide-react';
import type { View } from '@/App';

interface HeaderProps {
  criticalCount: number;
  isDark: boolean;
  onThemeToggle: () => void;
  pageTitle?: string;
  onMobileMenuOpen?: () => void;
  onNavigate?: (view: View) => void;
}

export function Header({
  criticalCount,
  isDark,
  onThemeToggle,
  pageTitle = 'Dashboard',
  onMobileMenuOpen,
  onNavigate,
}: HeaderProps) {
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Close avatar dropdown on outside click or Escape
  useEffect(() => {
    if (!avatarOpen) return;
    const onMouse = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); setAvatarOpen(false); }
    };
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouse);
      document.removeEventListener('keydown', onKey);
    };
  }, [avatarOpen]);

  const iconBtn = [
    'p-2 rounded-[var(--radius-md)] transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]',
  ].join(' ');

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

        {/* Notification bell */}
        <div className="relative">
          <button
            aria-label="Notifications"
            className={[
              iconBtn,
              criticalCount > 0
                ? 'text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)]'
                : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)]',
            ].join(' ')}
          >
            <Bell size={16} />
          </button>
          {/* Future badge dot placeholder */}
          {criticalCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-[var(--color-danger)] text-white text-[9px] font-bold rounded-[var(--radius-full)] flex items-center justify-center">
              {criticalCount}
            </span>
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
            MO
          </button>

          {avatarOpen && (
            <div className="absolute right-0 top-full mt-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] py-1 min-w-[160px] z-50">
              <button
                onClick={() => { onNavigate?.('settings'); setAvatarOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <Settings size={14} />
                Settings
              </button>
              <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-primary)] transition-colors">
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
