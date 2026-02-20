import { useState } from 'react';
import { Pencil } from 'lucide-react';
import type { PrintItemWithStatus, PrintCategory } from '@/types/printInventory';
import { StatusBadge } from './StatusBadge';
import type { ReorderStatus } from '@/types';

type CategoryFilter = PrintCategory | 'All';

interface Props {
  items: PrintItemWithStatus[];
  onEdit: (item: PrintItemWithStatus) => void;
}

const CATEGORY_FILTERS: CategoryFilter[] = ['All', 'Filament', 'Insert', 'Spare Part'];

const inputCls = 'bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-slate-200 text-sm rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/60 transition-colors';

export function PrintInventoryTable({ items, onEdit }: Props) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All');

  const filtered = items.filter((item) => {
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.material ?? '').toLowerCase().includes(q) ||
      (item.color ?? '').toLowerCase().includes(q) ||
      (item.insertSize ?? '').toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div>
      {/* Category filter tabs */}
      <div className="flex items-center gap-1 mb-3 flex-wrap">
        {CATEGORY_FILTERS.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              categoryFilter === cat
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, material, color…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full px-3 py-2.5 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${inputCls}`}
        />
      </div>

      {/* Mobile card view */}
      <div className="sm:hidden flex flex-col gap-2">
        {filtered.map((item) => (
          <div key={item.id} className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2 mb-2.5">
              <div className="min-w-0">
                <p className="text-slate-900 dark:text-slate-200 text-sm font-semibold leading-tight truncate">{item.name}</p>
                <p className="text-slate-400 text-[10px] mt-0.5">
                  {item.category}
                  {item.material && ` · ${item.material}`}
                  {item.color && ` · ${item.color}`}
                  {item.insertSize && ` · ${item.insertSize}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={item.status as ReorderStatus} />
                <button onClick={() => onEdit(item)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <Pencil size={13} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Stock', value: `${item.currentStock} ${item.unit}` },
                { label: 'Safety', value: `${item.safetyStock} ${item.unit}` },
                { label: 'Lead Time', value: `${item.leadTimeDays}d` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2">
                  <p className="text-slate-400 text-[9px] uppercase tracking-wider">{label}</p>
                  <p className="text-xs font-semibold mt-0.5 text-slate-800 dark:text-slate-200">{value}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center py-8 text-slate-400 text-sm">No items match the filter.</p>}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700/60">
              <tr>
                {['Name', 'Category', 'Details', 'Stock', 'Safety Stock', 'Lead Time', 'Value', 'Status', ''].map((h, i) => (
                  <th key={i} className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 dark:border-slate-700/30 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                  <td className="px-3 py-3">
                    <div className="text-slate-800 dark:text-slate-200 text-xs font-medium">{item.name}</div>
                    {item.supplier && <div className="text-slate-400 text-[10px]">{item.supplier}</div>}
                  </td>
                  <td className="px-3 py-3 text-slate-500 dark:text-slate-400 text-xs">{item.category}</td>
                  <td className="px-3 py-3 text-slate-500 dark:text-slate-400 text-xs">
                    {item.category === 'Filament' && `${item.material ?? '—'} · ${item.color ?? '—'}`}
                    {item.category === 'Insert' && `${item.insertSize ?? '—'} · ${item.insertType ?? '—'}`}
                    {item.category === 'Spare Part' && '—'}
                  </td>
                  <td className="px-3 py-3 text-slate-700 dark:text-slate-300 font-mono text-xs">{item.currentStock} {item.unit}</td>
                  <td className="px-3 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">{item.safetyStock} {item.unit}</td>
                  <td className="px-3 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">{item.leadTimeDays}d</td>
                  <td className="px-3 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">
                    {item.totalValue > 0
                      ? `$${item.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : '—'}
                  </td>
                  <td className="px-3 py-3"><StatusBadge status={item.status as ReorderStatus} /></td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => onEdit(item)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-10 text-slate-400 text-sm">No items match the filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-slate-400 text-xs mt-2">Showing {filtered.length} of {items.length} items</p>
    </div>
  );
}
