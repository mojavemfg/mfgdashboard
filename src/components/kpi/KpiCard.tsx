import type { ReactNode } from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent?: 'blue' | 'red' | 'green' | 'yellow';
  sub?: string;
}

const accentMap = {
  blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/15 ring-1 ring-blue-200 dark:ring-blue-500/20',
  red: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/15 ring-1 ring-red-200 dark:ring-red-500/20',
  green: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/15 ring-1 ring-green-200 dark:ring-green-500/20',
  yellow: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/15 ring-1 ring-yellow-200 dark:ring-yellow-500/20',
};

export function KpiCard({ label, value, icon, accent = 'blue', sub }: KpiCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/50 flex items-center gap-3 sm:gap-4 shadow-sm dark:shadow-none">
      <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 ${accentMap[accent]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs uppercase tracking-widest mb-0.5 font-medium">{label}</p>
        <p className="text-slate-900 dark:text-white text-xl sm:text-2xl font-bold leading-none">{value}</p>
        {sub && <p className="text-slate-400 dark:text-slate-500 text-[10px] sm:text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}
