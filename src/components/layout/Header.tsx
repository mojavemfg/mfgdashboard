import { Bell, Sun, Moon, Menu } from 'lucide-react';

interface HeaderProps {
  criticalCount: number;
  isDark: boolean;
  onThemeToggle: () => void;
  pageTitle?: string;
  onMobileMenuOpen?: () => void;
}

export function Header({
  criticalCount,
  isDark,
  onThemeToggle,
  pageTitle = 'Dashboard',
  onMobileMenuOpen,
}: HeaderProps) {
  return (
    <header
      className={[
        'h-12 flex items-center justify-between px-4 lg:px-6 shrink-0',
        'border-b border-[var(--color-border)] bg-[var(--color-bg)]',
      ].join(' ')}
    >
      {/* Left: hamburger (mobile) + page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuOpen}
          className={[
            'lg:hidden p-1.5 rounded-[var(--radius-md)] text-[var(--color-text-secondary)]',
            'hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)]',
            'transition-colors duration-150 focus-visible:outline-none',
            'focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]',
          ].join(' ')}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">
          {pageTitle}
        </span>
      </div>

      {/* Right: theme toggle + bell */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <button
          onClick={onThemeToggle}
          aria-label="Toggle theme"
          className={[
            'p-2 rounded-[var(--radius-md)] text-[var(--color-text-tertiary)]',
            'hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)]',
            'transition-colors duration-150 focus-visible:outline-none',
            'focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]',
          ].join(' ')}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notification bell */}
        <div className="relative">
          <button
            aria-label="Notifications"
            className={[
              'p-2 rounded-[var(--radius-md)]',
              criticalCount > 0
                ? 'text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)]'
                : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)]',
              'transition-colors duration-150 focus-visible:outline-none',
              'focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]',
            ].join(' ')}
          >
            <Bell size={16} />
          </button>
          {criticalCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-[var(--color-danger)] text-white text-[9px] font-bold rounded-[var(--radius-full)] flex items-center justify-center">
              {criticalCount}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
