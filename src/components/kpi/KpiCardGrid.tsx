import { Package, AlertTriangle, DollarSign, AlertOctagon } from 'lucide-react';
import { KpiCard } from './KpiCard';
import type { InventoryMetrics } from '@/hooks/useInventoryMetrics';

interface KpiCardGridProps {
  metrics: InventoryMetrics;
}

export function KpiCardGrid({ metrics }: KpiCardGridProps) {
  const { totalComponents, criticalCount, warningCount, needsReorderCount, totalInventoryValue } = metrics;

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
      <KpiCard
        label="Total Components"
        value={totalComponents}
        icon={<Package size={20} />}
        accent="blue"
      />
      <KpiCard
        label="Needs Reorder"
        value={needsReorderCount}
        icon={<AlertTriangle size={20} />}
        accent={needsReorderCount > 0 ? 'red' : 'green'}
        sub={`${criticalCount} critical · ${warningCount} warning`}
      />
      <KpiCard
        label="Critical Items"
        value={criticalCount}
        icon={<AlertOctagon size={20} />}
        accent={criticalCount > 0 ? 'red' : 'green'}
      />
      <KpiCard
        label="Inventory Value"
        value={`$${totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
        icon={<DollarSign size={20} />}
        accent="green"
        sub="at current stock"
      />
    </div>
  );
}
