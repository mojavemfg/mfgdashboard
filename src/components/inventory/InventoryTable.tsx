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
    if (sortKey === key) {
      setSortAsc((p) => !p);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (av === Infinity && bv === Infinity) return 0;
    if (av === Infinity) return sortAsc ? 1 : -1;
    if (bv === Infinity) return sortAsc ? -1 : 1;
    if (typeof av === 'string' && typeof bv === 'string') {
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp size={12} className="text-slate-600" />;
    return sortAsc ? <ChevronUp size={12} className="text-blue-400" /> : <ChevronDown size={12} className="text-blue-400" />;
  }

  function Th({ col, label }: { col: SortKey; label: string }) {
    return (
      <th
        onClick={() => handleSort(col)}
        className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200 select-none whitespace-nowrap"
      >
        <div className="flex items-center gap-1">
          {label}
          <SortIcon col={col} />
        </div>
      </th>
    );
  }

  return (
    <div>
      <InventorySearch filters={filters} onChange={setFilters} />
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/60 border-b border-slate-700">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">ID</th>
                <Th col="name" label="Name" />
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
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
                <tr key={c.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="px-3 py-2.5 text-slate-500 text-xs font-mono">{c.id}</td>
                  <td className="px-3 py-2.5">
                    <div className="text-slate-200 font-medium">{c.name}</div>
                    <div className="text-slate-500 text-xs">{c.sku}</div>
                  </td>
                  <td className="px-3 py-2.5 text-slate-400 text-xs">{c.category}</td>
                  <td className="px-3 py-2.5 text-slate-300 font-mono text-xs">{c.currentStock.toLocaleString()} {c.unit}</td>
                  <td className="px-3 py-2.5 text-slate-400 font-mono text-xs">{c.avgDailyConsumption.toFixed(1)}</td>
                  <td className="px-3 py-2.5 text-slate-400 font-mono text-xs">
                    {c.daysOfStockRemaining === Infinity ? '∞' : c.daysOfStockRemaining.toFixed(0)}
                  </td>
                  <td className="px-3 py-2.5 text-slate-400 font-mono text-xs">{c.reorderPoint.toFixed(0)}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">
                    <span className={c.daysUntilReorder <= 3 ? 'text-red-400' : c.daysUntilReorder <= 7 ? 'text-yellow-400' : 'text-slate-400'}>
                      {c.daysUntilReorder === Infinity ? '∞' : c.daysUntilReorder <= 0 ? 'NOW' : c.daysUntilReorder.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-400 text-xs font-mono">
                    ${c.totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={c.status} />
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-slate-500 text-sm">No components match the filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-slate-500 text-xs mt-2">Showing {sorted.length} of {components.length} components</p>
    </div>
  );
}
