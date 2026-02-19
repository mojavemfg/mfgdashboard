import type { ComponentWithMetrics } from '@/types';
import { AlertRow } from './AlertRow';
import { CheckCircle } from 'lucide-react';

interface ReorderAlertsPanelProps {
  components: ComponentWithMetrics[];
}

export function ReorderAlertsPanel({ components }: ReorderAlertsPanelProps) {
  const alerts = components
    .filter((c) => c.status === 'Critical' || c.status === 'Warning')
    .sort((a, b) => {
      // Sort: Critical first, then by daysUntilReorder ascending
      if (a.status !== b.status) {
        return a.status === 'Critical' ? -1 : 1;
      }
      const aDays = a.daysUntilReorder === Infinity ? 9999 : a.daysUntilReorder;
      const bDays = b.daysUntilReorder === Infinity ? 9999 : b.daysUntilReorder;
      return aDays - bDays;
    });

  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-2 text-green-400 bg-green-900/20 border border-green-800 rounded-lg px-4 py-3">
        <CheckCircle size={18} />
        <span className="text-sm">All components are within safe stock levels.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {alerts.map((c) => (
        <AlertRow key={c.id} component={c} />
      ))}
    </div>
  );
}
