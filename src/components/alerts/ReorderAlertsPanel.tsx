import type { ComponentWithMetrics } from '@/types';
import { AlertRow } from './AlertRow';
import { CheckCircle2 } from 'lucide-react';

interface ReorderAlertsPanelProps {
  components: ComponentWithMetrics[];
}

export function ReorderAlertsPanel({ components }: ReorderAlertsPanelProps) {
  const alerts = components
    .filter((c) => c.status === 'Critical' || c.status === 'Warning')
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'Critical' ? -1 : 1;
      const aDays = a.daysUntilReorder === Infinity ? 9999 : a.daysUntilReorder;
      const bDays = b.daysUntilReorder === Infinity ? 9999 : b.daysUntilReorder;
      return aDays - bDays;
    });

  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-2.5 text-[var(--color-success)] bg-[var(--color-success-subtle)] border border-[var(--color-success-border)] rounded-[var(--radius-lg)] px-4 py-3.5">
        <CheckCircle2 size={18} />
        <span className="text-sm">All components are within safe stock levels.</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
      {alerts.map((c) => (
        <AlertRow key={c.id} component={c} />
      ))}
    </div>
  );
}
