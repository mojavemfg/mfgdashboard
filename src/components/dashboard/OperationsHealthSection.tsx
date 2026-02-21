import type { ReactNode } from 'react';
import { ArrowRight, MapPin, Package, Printer, Truck } from 'lucide-react';
import type { View } from '@/App';
import type { InventoryMetrics } from '@/hooks/useInventoryMetrics';
import type { SalesMetrics } from '@/hooks/useDashboardSalesMetrics';
import { Badge } from '@/components/ui/Badge';

interface OperationsHealthSectionProps {
  inventoryMetrics: InventoryMetrics;
  printKpis: { total: number; critical: number; warning: number; totalValue: number };
  salesMetrics: SalesMetrics;
  totalOrders: number;
  onNavigate: (view: View) => void;
}

interface HealthCardProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  onNavigate?: () => void;
}

function HealthCard({ icon, title, children, onNavigate }: HealthCardProps) {
  return (
    <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[var(--color-text-tertiary)]">{icon}</span>
          <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
            {title}
          </span>
        </div>
        {onNavigate && (
          <button
            onClick={onNavigate}
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-brand)] transition-colors duration-150 focus-visible:outline-none"
            aria-label={`Navigate to ${title}`}
          >
            <ArrowRight size={14} />
          </button>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

export function OperationsHealthSection({
  inventoryMetrics,
  printKpis,
  salesMetrics,
  totalOrders,
  onNavigate,
}: OperationsHealthSectionProps) {
  const { criticalCount, warningCount, totalComponents } = inventoryMetrics;
  const { unshippedCount, topCountries } = salesMetrics;

  const shippedCount = totalOrders - unshippedCount;
  const shipPct      = totalOrders > 0 ? (shippedCount / totalOrders) * 100 : 0;
  const invHealthy   = totalComponents - criticalCount - warningCount;
  const printHealthy = printKpis.total - printKpis.critical - printKpis.warning;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Fulfillment */}
      <HealthCard icon={<Truck size={14} />} title="Fulfillment" onNavigate={() => onNavigate('orders')}>
        {totalOrders === 0 ? (
          <p className="text-xs text-[var(--color-text-tertiary)]">No orders loaded</p>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-[var(--color-text-secondary)]">
                {shippedCount} / {totalOrders} shipped
              </span>
              <span className={`font-semibold tabular-nums ${unshippedCount > 5 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}`}>
                {shipPct.toFixed(0)}%
              </span>
            </div>
            <div className="h-1 bg-[var(--color-bg-muted)] rounded-[var(--radius-full)] overflow-hidden">
              <div
                className={`h-full rounded-[var(--radius-full)] transition-all ${unshippedCount > 5 ? 'bg-[var(--color-danger)]' : 'bg-[var(--color-success)]'}`}
                style={{ width: `${shipPct}%` }}
              />
            </div>
            {unshippedCount > 0 && (
              <p className="text-xs text-[var(--color-warning)] mt-2">{unshippedCount} unshipped</p>
            )}
          </>
        )}
      </HealthCard>

      {/* Component inventory */}
      <HealthCard icon={<Package size={14} />} title="Components">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="success">{invHealthy} OK</Badge>
          {warningCount > 0 && <Badge variant="warning">{warningCount} warning</Badge>}
          {criticalCount > 0 && <Badge variant="danger">{criticalCount} critical</Badge>}
        </div>
      </HealthCard>

      {/* Print inventory */}
      <HealthCard icon={<Printer size={14} />} title="Print Inventory" onNavigate={() => onNavigate('inventory')}>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="success">{printHealthy} OK</Badge>
          {printKpis.warning > 0 && <Badge variant="warning">{printKpis.warning} warning</Badge>}
          {printKpis.critical > 0 && <Badge variant="danger">{printKpis.critical} critical</Badge>}
        </div>
      </HealthCard>

      {/* Top markets */}
      <HealthCard icon={<MapPin size={14} />} title="Top Markets" onNavigate={() => onNavigate('salesmap')}>
        {topCountries.length === 0 ? (
          <p className="text-xs text-[var(--color-text-tertiary)]">No orders loaded</p>
        ) : (
          <div className="space-y-1.5">
            {topCountries.map((c, i) => (
              <div key={c.country} className="flex items-center justify-between text-xs">
                <span className={i === 0 ? 'font-medium text-[var(--color-text-primary)] truncate' : 'text-[var(--color-text-secondary)] truncate'}>
                  {c.country}
                </span>
                <span className="tabular-nums text-[var(--color-text-tertiary)] ml-2 shrink-0">
                  {c.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </HealthCard>
    </div>
  );
}
