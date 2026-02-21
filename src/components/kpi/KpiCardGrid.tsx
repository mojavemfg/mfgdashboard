import { KpiCard } from './KpiCard';
import type { InventoryMetrics } from '@/hooks/useInventoryMetrics';

interface KpiCardGridProps {
  metrics: InventoryMetrics;
}

export function KpiCardGrid({ metrics }: KpiCardGridProps) {
  const { totalComponents, criticalCount, warningCount, needsReorderCount, totalInventoryValue } = metrics;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KpiCard
        label="Total Components"
        value={totalComponents}
      />
      <KpiCard
        label="Needs Reorder"
        value={needsReorderCount}
        sub={`${criticalCount} critical · ${warningCount} warning`}
      />
      <KpiCard
        label="Critical Items"
        value={criticalCount}
      />
      <KpiCard
        label="Inventory Value"
        value={`$${totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
        sub="at current stock"
      />
    </div>
  );
}
