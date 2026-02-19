import type { ComponentWithMetrics } from '@/types';

interface AlertRowProps {
  component: ComponentWithMetrics;
}

export function AlertRow({ component }: AlertRowProps) {
  const isCritical = component.status === 'Critical';

  const rowBg = isCritical
    ? 'border-red-200 bg-red-50 dark:border-red-800/60 dark:bg-red-950/20'
    : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800/50 dark:bg-yellow-950/10';

  const badge = isCritical
    ? 'bg-red-100 text-red-700 border border-red-300 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/40'
    : 'bg-yellow-100 text-yellow-700 border border-yellow-300 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/40';

  const urgencyColor = isCritical
    ? 'text-red-600 dark:text-red-400'
    : 'text-yellow-600 dark:text-yellow-400';

  const daysUntil =
    component.daysUntilReorder === Infinity
      ? '—'
      : component.daysUntilReorder <= 0
      ? 'NOW'
      : `${Math.ceil(component.daysUntilReorder)}d`;

  return (
    <div className={`rounded-xl border ${rowBg} p-3 sm:p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${badge}`}>
            {component.status.toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="text-slate-900 dark:text-white text-sm font-semibold truncate leading-tight">{component.name}</p>
            <p className="text-slate-500 text-xs mt-0.5">{component.id} · {component.supplier}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-base font-bold ${urgencyColor}`}>{daysUntil}</p>
          <p className="text-slate-400 dark:text-slate-500 text-[10px]">to reorder</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-700/40 grid grid-cols-3 gap-2">
        <div>
          <p className="text-slate-400 text-[10px] uppercase tracking-wider">Reorder Date</p>
          <p className="text-slate-700 dark:text-slate-200 text-xs font-medium mt-0.5">{component.predictedReorderDate}</p>
        </div>
        <div>
          <p className="text-slate-400 text-[10px] uppercase tracking-wider">Suggest Qty</p>
          <p className="text-slate-700 dark:text-slate-200 text-xs font-medium mt-0.5">{component.reorderQty.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-slate-400 text-[10px] uppercase tracking-wider">Stock Left</p>
          <p className="text-slate-700 dark:text-slate-200 text-xs font-medium mt-0.5">{component.currentStock.toLocaleString()} {component.unit}</p>
        </div>
      </div>
    </div>
  );
}
