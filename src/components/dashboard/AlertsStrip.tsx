import type { ReactNode } from 'react';
import { AlertOctagon, AlertTriangle, CheckCircle2, ShoppingBag } from 'lucide-react';
import type { View } from '@/App';

interface AlertsStripProps {
  unshippedCount: number;
  criticalCount: number;
  warningCount: number;
  onNavigate: (view: View) => void;
}

interface AlertCardProps {
  icon: ReactNode;
  label: string;
  value: number;
  accent: 'red' | 'amber';
  onClick: () => void;
}

function AlertCard({ icon, label, value, accent, onClick }: AlertCardProps) {
  const bg =
    accent === 'red'
      ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-950/50'
      : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-950/50';
  const iconCls = accent === 'red' ? 'text-red-500' : 'text-amber-500';
  const valueCls =
    accent === 'red'
      ? 'text-red-700 dark:text-red-400'
      : 'text-amber-700 dark:text-amber-400';

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors cursor-pointer text-left flex-1 min-w-[140px] ${bg}`}
    >
      <span className={`shrink-0 ${iconCls}`}>{icon}</span>
      <div className="min-w-0">
        <div className={`text-xl font-bold tabular-nums ${valueCls}`}>{value}</div>
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{label}</div>
      </div>
    </button>
  );
}

export function AlertsStrip({ unshippedCount, criticalCount, warningCount, onNavigate }: AlertsStripProps) {
  const hasAlerts = unshippedCount > 0 || criticalCount > 0 || warningCount > 0;

  if (!hasAlerts) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          All Clear — no urgent items
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {unshippedCount > 0 && (
        <AlertCard
          icon={<ShoppingBag size={18} />}
          label="Unshipped Orders"
          value={unshippedCount}
          accent="amber"
          onClick={() => onNavigate('orders')}
        />
      )}
      {criticalCount > 0 && (
        <AlertCard
          icon={<AlertOctagon size={18} />}
          label="Critical Inventory"
          value={criticalCount}
          accent="red"
          onClick={() => onNavigate('inventory')}
        />
      )}
      {warningCount > 0 && (
        <AlertCard
          icon={<AlertTriangle size={18} />}
          label="Reorder Warnings"
          value={warningCount}
          accent="amber"
          onClick={() => onNavigate('inventory')}
        />
      )}
    </div>
  );
}
