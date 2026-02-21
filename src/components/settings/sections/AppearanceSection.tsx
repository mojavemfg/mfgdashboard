import { Sun, Moon } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface Props {
  isDark: boolean;
  onThemeToggle: () => void;
}

export function AppearanceSection({ isDark, onThemeToggle }: Props) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isDark
            ? <Moon size={16} className="text-[var(--color-text-tertiary)]" />
            : <Sun size={16} className="text-[var(--color-warning)]" />
          }
          <div>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              {isDark ? 'Easy on the eyes at night' : 'Better for bright environments'}
            </p>
          </div>
        </div>

        {/* Toggle switch */}
        <button
          onClick={onThemeToggle}
          aria-label="Toggle theme"
          className={[
            'relative inline-flex h-6 w-11 items-center rounded-[var(--radius-full)]',
            'transition-colors duration-200 focus-visible:outline-none',
            'focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2',
            isDark ? 'bg-[var(--color-brand)]' : 'bg-[var(--color-border-strong)]',
          ].join(' ')}
        >
          <span
            className={[
              'inline-block h-5 w-5 rounded-[var(--radius-full)] bg-white shadow-[var(--shadow-xs)]',
              'transition-transform duration-200',
              isDark ? 'translate-x-5' : 'translate-x-0.5',
            ].join(' ')}
          />
        </button>
      </div>
    </Card>
  );
}
