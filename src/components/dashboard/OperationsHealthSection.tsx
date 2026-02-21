import type { ReactNode } from 'react';
import { ArrowRight, MapPin, Package, Printer, Truck } from 'lucide-react';
import type { View } from '@/App';
import type { InventoryMetrics } from '@/hooks/useInventoryMetrics';
import type { SalesMetrics } from '@/hooks/useDashboardSalesMetrics';

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
    <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-4 flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 dark:text-slate-500">{icon}</span>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
            {title}
          </span>
        </div>
        {onNavigate && (
          <button
            onClick={onNavigate}
            className="text-slate-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowRight size={14} />
          </button>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

function StatusPill({
  count,
  label,
  color,
}: {
  count: number;
  label: string;
  color: 'red' | 'amber' | 'green';
}) {
  const cls =
    color === 'red'
      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
      : color === 'amber'
      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
      : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-lg ${cls}`}>
      {count} {label}
    </span>
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
  const shipPct = totalOrders > 0 ? (shippedCount / totalOrders) * 100 : 0;
  const invHealthy = totalComponents - criticalCount - warningCount;
  const printHealthy = printKpis.total - printKpis.critical - printKpis.warning;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
      {/* Fulfillment */}
      <HealthCard
        icon={<Truck size={15} />}
        title="Fulfillment"
        onNavigate={() => onNavigate('orders')}
      >
        {totalOrders === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500">No orders loaded</p>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                {shippedCount} / {totalOrders} shipped
              </span>
              <span
                className={`font-semibold tabular-nums ${
                  unshippedCount > 5
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {shipPct.toFixed(0)}%
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  unshippedCount > 5 ? 'bg-red-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${shipPct}%` }}
              />
            </div>
            {unshippedCount > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 font-medium">
                {unshippedCount} unshipped
              </p>
            )}
          </>
        )}
      </HealthCard>

      {/* Component inventory */}
      <HealthCard
        icon={<Package size={15} />}
        title="Components"
      >
        <div className="flex flex-wrap gap-1.5">
          <StatusPill count={invHealthy} label="OK" color="green" />
          {warningCount > 0 && <StatusPill count={warningCount} label="warning" color="amber" />}
          {criticalCount > 0 && <StatusPill count={criticalCount} label="critical" color="red" />}
        </div>
      </HealthCard>

      {/* Print inventory */}
      <HealthCard
        icon={<Printer size={15} />}
        title="Print Inventory"
        onNavigate={() => onNavigate('inventory')}
      >
        <div className="flex flex-wrap gap-1.5">
          <StatusPill count={printHealthy} label="OK" color="green" />
          {printKpis.warning > 0 && (
            <StatusPill count={printKpis.warning} label="warning" color="amber" />
          )}
          {printKpis.critical > 0 && (
            <StatusPill count={printKpis.critical} label="critical" color="red" />
          )}
        </div>
      </HealthCard>

      {/* Top markets */}
      <HealthCard
        icon={<MapPin size={15} />}
        title="Top Markets"
        onNavigate={() => onNavigate('salesmap')}
      >
        {topCountries.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500">No orders loaded</p>
        ) : (
          <div className="space-y-1.5">
            {topCountries.map((c, i) => (
              <div key={c.country} className="flex items-center justify-between text-xs">
                <span
                  className={
                    i === 0
                      ? 'font-semibold text-slate-700 dark:text-slate-200 truncate'
                      : 'text-slate-500 dark:text-slate-400 truncate'
                  }
                >
                  {c.country}
                </span>
                <span className="tabular-nums text-slate-500 dark:text-slate-400 ml-2 shrink-0">
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
