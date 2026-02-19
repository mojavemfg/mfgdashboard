import type { ComponentWithMetrics } from '@/types';

interface AlertRowProps {
  component: ComponentWithMetrics;
}

export function AlertRow({ component }: AlertRowProps) {
  const isCritical = component.status === 'Critical';
  const rowBorder = isCritical ? 'border-red-800 bg-red-950/30' : 'border-yellow-800 bg-yellow-950/20';
  const badge = isCritical
    ? 'bg-red-500/20 text-red-400 border border-red-600'
    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-600';

  const daysUntil =
    component.daysUntilReorder === Infinity
      ? '—'
      : component.daysUntilReorder <= 0
      ? 'NOW'
      : `${Math.ceil(component.daysUntilReorder)}d`;

  return (
    <div className={`flex items-center gap-4 px-4 py-3 rounded-lg border ${rowBorder}`}>
      <span className={`text-xs font-bold px-2 py-0.5 rounded ${badge} shrink-0`}>
        {component.status.toUpperCase()}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{component.name}</p>
        <p className="text-slate-400 text-xs">{component.id} · {component.supplier}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-slate-300 text-sm font-semibold">{daysUntil}</p>
        <p className="text-slate-500 text-xs">until reorder</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-slate-300 text-sm font-semibold">{component.predictedReorderDate}</p>
        <p className="text-slate-500 text-xs">reorder date</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-slate-300 text-sm font-semibold">{component.reorderQty.toLocaleString()}</p>
        <p className="text-slate-500 text-xs">suggest qty</p>
      </div>
    </div>
  );
}
