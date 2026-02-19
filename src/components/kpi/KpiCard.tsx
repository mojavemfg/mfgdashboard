import type { ReactNode } from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent?: 'blue' | 'red' | 'green' | 'yellow';
  sub?: string;
}

const accentMap = {
  blue: 'text-blue-400 bg-blue-900/30',
  red: 'text-red-400 bg-red-900/30',
  green: 'text-green-400 bg-green-900/30',
  yellow: 'text-yellow-400 bg-yellow-900/30',
};

export function KpiCard({ label, value, icon, accent = 'blue', sub }: KpiCardProps) {
  const colors = accentMap[accent];
  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${colors}`}>{icon}</div>
      <div>
        <p className="text-slate-400 text-xs uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-white text-2xl font-bold">{value}</p>
        {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
