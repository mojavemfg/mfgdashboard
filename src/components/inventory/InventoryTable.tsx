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

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp size={11} className="text-slate-300 dark:text-slate-600" />;
    return sortAsc ? <ChevronUp size={11} className="text-blue-500" /> : <ChevronDown size={11} className="text-blue-500" />;
  }

  function Th({ col, label }: { col: SortKey; label: string }) {
    return (
      <th onClick={() => handleSort(col)} className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 select-none whitespace-nowrap">
        <div className="flex items-center gap-1">{label}<SortIcon col={col} /></div>
      </th>
    );
  }

  const urgencyText = (c: ComponentWithMetrics) =>
    c.daysUntilReorder <= 3 ? 'text-red-600 dark:text-red-400 font-semibold' :
    c.daysUntilReorder <= 7 ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-500 dark:text-slate-400';

  return (
    <div>
      <InventorySearch filters={filters} onChange={setFilters} />

      {/* Mobile card view */}
      <div className="sm:hidden flex flex-col gap-2">
        {sorted.map((c) => (
          <div key={c.id} className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 p-3 shadow-sm dark:shadow-none">
            <div className="flex items-start justify-between gap-2 mb-2.5">
              <div className="min-w-0">
                <p className="text-slate-900 dark:text-slate-200 text-sm font-semibold leading-tight truncate">{c.name}</p>
                <p className="text-slate-400 text-[10px] mt-0.5">{c.id} · {c.sku}</p>
              </div>
              <StatusBadge status={c.status} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Stock', value: c.currentStock.toLocaleString(), cls: 'text-slate-800 dark:text-slate-200' },
                { label: 'Days Left', value: c.daysOfStockRemaining === Infinity ? '∞' : c.daysOfStockRemaining.toFixed(0), cls: urgencyText(c) },
                { label: 'Avg/Day', value: c.avgDailyConsumption.toFixed(1), cls: 'text-slate-800 dark:text-slate-200' },
              ].map(({ label, value, cls }) => (
                <div key={label} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2">
                  <p className="text-slate-400 text-[9px] uppercase tracking-wider">{label}</p>
                  <p className={`text-xs font-semibold mt-0.5 ${cls}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
        {sorted.length === 0 && <p className="text-center py-8 text-slate-400 text-sm">No components match the filters.</p>}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden shadow-sm dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700/60">
              <tr>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ID</th>
                <Th col="name" label="Name" />
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                <Th col="currentStock" label="Stock" />
                <Th col="avgDailyConsumption" label="Avg/Day" />
                <Th col="daysOfStockRemaining" label="Days Left" />
                <Th col="reorderPoint" label="Reorder Pt" />
                <Th col="daysUntilReorder" label="Days to RO" />
                <Th col="totalInventoryValue" label="Value" />
                <Th col="status" label="Status" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 dark:border-slate-700/30 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                  <td className="px-3 py-3 text-slate-400 text-xs font-mono">{c.id}</td>
                  <td className="px-3 py-3">
                    <div className="text-slate-800 dark:text-slate-200 text-xs font-medium">{c.name}</div>
                    <div className="text-slate-400 text-[10px]">{c.sku}</div>
                  </td>
                  <td className="px-3 py-3 text-slate-500 dark:text-slate-400 text-xs">{c.category}</td>
                  <td className="px-3 py-3 text-slate-700 dark:text-slate-300 font-mono text-xs">{c.currentStock.toLocaleString()} {c.unit}</td>
                  <td className="px-3 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">{c.avgDailyConsumption.toFixed(1)}</td>
                  <td className="px-3 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">
                    {c.daysOfStockRemaining === Infinity ? '∞' : c.daysOfStockRemaining.toFixed(0)}
                  </td>
                  <td className="px-3 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">{c.reorderPoint.toFixed(0)}</td>
                  <td className="px-3 py-3 font-mono text-xs">
                    <span className={urgencyText(c)}>
                      {c.daysUntilReorder === Infinity ? '∞' : c.daysUntilReorder <= 0 ? 'NOW' : c.daysUntilReorder.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-500 dark:text-slate-400 text-xs font-mono">
                    ${c.totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-3"><StatusBadge status={c.status} /></td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr><td colSpan={10} className="text-center py-10 text-slate-400 text-sm">No components match the filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-slate-400 text-xs mt-2">Showing {sorted.length} of {components.length} components</p>
    </div>
  );
}
