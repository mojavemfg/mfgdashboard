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
  variant: 'danger' | 'warning';
  onClick: () => void;
}

function AlertCard({ icon, label, value, variant, onClick }: AlertCardProps) {
  const styles =
    variant === 'danger'
      ? 'bg-[var(--color-danger-subtle)] border-red-200 dark:border-red-900/50 text-[var(--color-danger)] hover:bg-red-100 dark:hover:bg-red-950/50'
      : 'bg-[var(--color-warning-subtle)] border-amber-200 dark:border-amber-900/50 text-[var(--color-warning)] hover:bg-amber-100 dark:hover:bg-amber-950/50';

  return (
    <button
      onClick={onClick}
      className={[
        'flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] border',
        'transition-colors duration-150 cursor-pointer text-left flex-1 min-w-[140px]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]',
        styles,
      ].join(' ')}
    >
      <span className="shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-xl font-bold tabular-nums leading-none">{value}</div>
        <div className="text-xs font-medium text-[var(--color-text-secondary)] truncate mt-0.5">{label}</div>
      </div>
    </button>
  );
}

export function AlertsStrip({ unshippedCount, criticalCount, warningCount, onNavigate }: AlertsStripProps) {
  const hasAlerts = unshippedCount > 0 || criticalCount > 0 || warningCount > 0;

  if (!hasAlerts) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-[var(--color-success-subtle)] border border-green-200 dark:border-green-900/50 rounded-[var(--radius-lg)]">
        <CheckCircle2 size={16} className="text-[var(--color-success)] shrink-0" />
        <span className="text-sm font-medium text-[var(--color-success)]">
          All clear — no urgent items
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {unshippedCount > 0 && (
        <AlertCard
          icon={<ShoppingBag size={16} />}
          label="Unshipped Orders"
          value={unshippedCount}
          variant="warning"
          onClick={() => onNavigate('orders')}
        />
      )}
      {criticalCount > 0 && (
        <AlertCard
          icon={<AlertOctagon size={16} />}
          label="Critical Inventory"
          value={criticalCount}
          variant="danger"
          onClick={() => onNavigate('inventory')}
        />
      )}
      {warningCount > 0 && (
        <AlertCard
          icon={<AlertTriangle size={16} />}
          label="Reorder Warnings"
          value={warningCount}
          variant="warning"
          onClick={() => onNavigate('inventory')}
        />
      )}
    </div>
  );
}
