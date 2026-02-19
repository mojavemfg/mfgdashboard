import { Search } from 'lucide-react';
import type { FilterState } from '@/hooks/useComponentFilter';
import type { ComponentCategory, ReorderStatus } from '@/types';

const CATEGORIES: (ComponentCategory | 'All')[] = [
  'All', 'Passive', 'Semiconductor', 'PCB', 'Display', 'Mechanical', 'Connector', 'Cable', 'Fastener',
];
const STATUSES: (ReorderStatus | 'All')[] = ['All', 'Critical', 'Warning', 'OK'];

interface InventorySearchProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
}

export function InventorySearch({ filters, onChange }: InventorySearchProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <div className="relative flex-1 min-w-48">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search components…"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded-lg pl-9 pr-3 py-2 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>
      <select
        value={filters.category}
        onChange={(e) => onChange({ ...filters, category: e.target.value as FilterState['category'] })}
        className="bg-slate-800 border border-slate-600 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
        ))}
      </select>
      <select
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value as FilterState['status'] })}
        className="bg-slate-800 border border-slate-600 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
        ))}
      </select>
    </div>
  );
}
