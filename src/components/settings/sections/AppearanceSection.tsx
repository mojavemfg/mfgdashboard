import { Sun, Moon } from 'lucide-react';

interface Props {
  isDark: boolean;
  onThemeToggle: () => void;
}

const cardCls = 'bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none p-5';

export function AppearanceSection({ isDark, onThemeToggle }: Props) {
  return (
    <div className={cardCls}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isDark
            ? <Moon size={18} className="text-slate-400" />
            : <Sun size={18} className="text-amber-500" />
          }
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isDark ? 'Easy on the eyes at night' : 'Better for bright environments'}
            </p>
          </div>
        </div>
        <button
          onClick={onThemeToggle}
          aria-label="Toggle theme"
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            isDark ? 'bg-blue-600' : 'bg-slate-300'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
              isDark ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
