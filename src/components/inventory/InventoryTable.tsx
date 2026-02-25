import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { ComponentWithMetrics } from '@/types';
import { StatusBadge } from './StatusBadge';
import { useComponentFilter } from '@/hooks/useComponentFilter';
import { InventorySearch } from './InventorySearch';

type SortKey = keyof Pick<
  ComponentWithMetrics,
  'name' | 'currentStock' | 'avgDailyConsumption' | 'daysOfStockRemaining' | 'reorderPoint' | 'daysUntilReorder' | 'totalInventoryValue' | 'status'
>;

interface InventoryTableProps {
  components: ComponentWithMetrics[];
}

export function InventoryTable({ components }: InventoryTableProps) {
  const { filters, setFilters, filtered } = useComponentFilter(components);
  const [sortKey, setSortKey] = useState<SortKey>('daysUntilReorder');
  const [sortAsc, setSortAsc] = useState(true);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((p) => !p);
    else { setSortKey(key); setSortAsc(true); }
  }

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey]; const bv = b[sortKey];
    if (av === Infinity && bv === Infinity) return 0;
    if (av === Infinity) return sortAsc ? 1 : -1;
    if (bv === Infinity) return sortAsc ? -1 : 1;
    if (typeof av === 'string' && typeof bv === 'string')
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  const sortIcon = (col: SortKey) => {
    if (sortKey !== col) return <ChevronUp size={11} className="text-[var(--color-border-strong)]" />;
    return sortAsc ? <ChevronUp size={11} className="text-[var(--color-brand)]" /> : <ChevronDown size={11} className="text-[var(--color-brand)]" />;
  };

  const th = (col: SortKey, label: string) => (
    <th onClick={() => handleSort(col)} className="px-3 py-2.5 text-left text-[10px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider cursor-pointer hover:text-[var(--color-text-primary)] select-none whitespace-nowrap">
      <div className="flex items-center gap-1">{label}{sortIcon(col)}</div>
    </th>
  );

  const urgencyText = (c: ComponentWithMetrics) =>
    c.daysUntilReorder <= 3 ? 'text-[var(--color-danger)] font-semibold' :
    c.daysUntilReorder <= 7 ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-tertiary)]';

  return (
    <div>
      <InventorySearch filters={filters} onChange={setFilters} />

      {/* Mobile card view — phones only (< 768px) */}
      <div className="md:hidden flex flex-col gap-2">
        {sorted.map((c) => (
          <div key={c.id} className="bg-[var(--color-bg)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-3">
            <div className="flex items-start justify-between gap-2 mb-2.5">
              <div className="min-w-0">
                <p className="text-[var(--color-text-primary)] text-sm font-semibold leading-tight truncate">{c.name}</p>
                <p className="text-[var(--color-text-tertiary)] text-[10px] mt-0.5">{c.id} · {c.sku}</p>
              </div>
              <StatusBadge status={c.status} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Stock', value: c.currentStock.toLocaleString(), cls: 'text-[var(--color-text-primary)]' },
                { label: 'Days Left', value: c.daysOfStockRemaining === Infinity ? '∞' : c.daysOfStockRemaining.toFixed(0), cls: urgencyText(c) },
                { label: 'Avg/Day', value: c.avgDailyConsumption.toFixed(1), cls: 'text-[var(--color-text-primary)]' },
              ].map(({ label, value, cls }) => (
                <div key={label} className="bg-[var(--color-bg-subtle)] rounded-[var(--radius-md)] p-2">
                  <p className="text-[var(--color-text-tertiary)] text-[9px] uppercase tracking-wider">{label}</p>
                  <p className={`text-xs font-semibold mt-0.5 ${cls}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
        {sorted.length === 0 && <p className="text-center py-8 text-[var(--color-text-tertiary)] text-sm">No components match the filters.</p>}
      </div>

      {/* Tablet + desktop table */}
      <div className="hidden md:block bg-[var(--color-bg)] rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-bg-subtle)] border-b border-[var(--color-border)]">
              <tr>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">ID</th>
                {th('name', 'Name')}
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">Category</th>
                {th('currentStock', 'Stock')}
                {th('avgDailyConsumption', 'Avg/Day')}
                {th('daysOfStockRemaining', 'Days Left')}
                {th('reorderPoint', 'Reorder Pt')}
                {th('daysUntilReorder', 'Days to RO')}
                {th('totalInventoryValue', 'Value')}
                {th('status', 'Status')}
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <tr key={c.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-subtle)] transition-colors duration-100">
                  <td className="px-3 py-3 text-[var(--color-text-tertiary)] text-xs font-mono">{c.id}</td>
                  <td className="px-3 py-3">
                    <div className="text-[var(--color-text-primary)] text-xs font-medium">{c.name}</div>
                    <div className="text-[var(--color-text-tertiary)] text-[10px]">{c.sku}</div>
                  </td>
                  <td className="px-3 py-3 text-[var(--color-text-secondary)] text-xs">{c.category}</td>
                  <td className="px-3 py-3 text-[var(--color-text-secondary)] font-mono text-xs">{c.currentStock.toLocaleString()} {c.unit}</td>
                  <td className="px-3 py-3 text-[var(--color-text-tertiary)] font-mono text-xs">{c.avgDailyConsumption.toFixed(1)}</td>
                  <td className="px-3 py-3 text-[var(--color-text-tertiary)] font-mono text-xs">
                    {c.daysOfStockRemaining === Infinity ? '∞' : c.daysOfStockRemaining.toFixed(0)}
                  </td>
                  <td className="px-3 py-3 text-[var(--color-text-tertiary)] font-mono text-xs">{c.reorderPoint.toFixed(0)}</td>
                  <td className="px-3 py-3 font-mono text-xs">
                    <span className={urgencyText(c)}>
                      {c.daysUntilReorder === Infinity ? '∞' : c.daysUntilReorder <= 0 ? 'NOW' : c.daysUntilReorder.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-[var(--color-text-tertiary)] text-xs font-mono">
                    ${c.totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-3"><StatusBadge status={c.status} /></td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr><td colSpan={10} className="text-center py-10 text-[var(--color-text-tertiary)] text-sm">No components match the filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[var(--color-text-tertiary)] text-xs mt-2">Showing {sorted.length} of {components.length} components</p>
    </div>
  );
}
