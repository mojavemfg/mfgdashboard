import { Factory, Bell, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  criticalCount: number;
  isDark: boolean;
  onThemeToggle: () => void;
}

export function Header({ criticalCount, isDark, onThemeToggle }: HeaderProps) {
  return (
    <header className="bg-white/90 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-700/60 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="bg-blue-500/15 dark:bg-blue-500/20 p-1.5 rounded-lg">
          <Factory className="text-blue-600 dark:text-blue-400" size={20} />
        </div>
        <div>
          <h1 className="text-slate-900 dark:text-white font-bold text-base sm:text-lg leading-tight tracking-tight">
            MFG Ops
          </h1>
          <p className="text-slate-400 dark:text-slate-500 text-[10px] hidden sm:block">Manufacturing Operations</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-slate-400 dark:text-slate-500 text-xs hidden sm:block mr-1">Feb 19, 2026</span>

        {/* Theme toggle */}
        <button
          onClick={onThemeToggle}
          aria-label="Toggle theme"
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer border-none bg-transparent"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Bell */}
        <div className="relative">
          <div className={`p-1.5 rounded-lg ${criticalCount > 0 ? 'bg-red-500/10 dark:bg-red-500/15' : 'bg-slate-100 dark:bg-slate-800'}`}>
            <Bell className={criticalCount > 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'} size={18} />
          </div>
          {criticalCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {criticalCount}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
