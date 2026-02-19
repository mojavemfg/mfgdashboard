import type { ReactNode } from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent?: 'blue' | 'red' | 'green' | 'yellow';
  sub?: string;
}

const accentMap = {
  blue: { icon: 'text-blue-400 bg-blue-500/15 ring-1 ring-blue-500/20', border: 'border-blue-500/10' },
  red: { icon: 'text-red-400 bg-red-500/15 ring-1 ring-red-500/20', border: 'border-red-500/10' },
  green: { icon: 'text-green-400 bg-green-500/15 ring-1 ring-green-500/20', border: 'border-green-500/10' },
  yellow: { icon: 'text-yellow-400 bg-yellow-500/15 ring-1 ring-yellow-500/20', border: 'border-yellow-500/10' },
};

export function KpiCard({ label, value, icon, accent = 'blue', sub }: KpiCardProps) {
  const { icon: iconClass, border } = accentMap[accent];
  return (
    <div className={`bg-slate-800/60 rounded-2xl p-4 sm:p-5 border border-slate-700/50 ${border} flex items-center gap-3 sm:gap-4 backdrop-blur`}>
      <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 ${iconClass}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-slate-400 text-[10px] sm:text-xs uppercase tracking-widest mb-0.5 font-medium">{label}</p>
        <p className="text-white text-xl sm:text-2xl font-bold leading-none">{value}</p>
        {sub && <p className="text-slate-500 text-[10px] sm:text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}
