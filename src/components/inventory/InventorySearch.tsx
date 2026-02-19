import { Search } from 'lucide-react';
import type { FilterState } from '@/hooks/useComponentFilter';
import type { ComponentCategory, ReorderStatus } from '@/types';

const CATEGORIES: (ComponentCategory | 'All')[] = [
  'All', 'Passive', 'Semiconductor', 'PCB', 'Display', 'Mechanical', 'Connector', 'Cable', 'Fastener',
];
const STATUSES: (ReorderStatus | 'All')[] = ['All', 'Critical', 'Warning', 'OK'];

const inputCls = 'bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-slate-200 text-sm rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/60 focus:bg-white dark:focus:bg-slate-800 transition-colors';

interface InventorySearchProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
}

export function InventorySearch({ filters, onChange }: InventorySearchProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
      <div className="relative flex-1">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, SKU, or ID…"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className={`w-full pl-9 pr-3 py-2.5 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${inputCls}`}
        />
      </div>
      <div className="flex gap-2 sm:gap-3">
        <select
          value={filters.category}
          onChange={(e) => onChange({ ...filters, category: e.target.value as FilterState['category'] })}
          className={`flex-1 sm:flex-none px-3 py-2.5 ${inputCls}`}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value as FilterState['status'] })}
          className={`flex-1 sm:flex-none px-3 py-2.5 ${inputCls}`}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
