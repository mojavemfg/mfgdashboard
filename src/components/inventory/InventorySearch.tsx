import { Search } from 'lucide-react';
import type { FilterState } from '@/hooks/useComponentFilter';
import type { ComponentCategory, ReorderStatus } from '@/types';

const CATEGORIES: (ComponentCategory | 'All')[] = [
  'All', 'Passive', 'Semiconductor', 'PCB', 'Display', 'Mechanical', 'Connector', 'Cable', 'Fastener',
];
const STATUSES: (ReorderStatus | 'All')[] = ['All', 'Critical', 'Warning', 'OK'];

const inputCls = [
  'bg-[var(--color-bg)] border border-[var(--color-border)]',
  'text-[var(--color-text-primary)] text-sm rounded-[var(--radius-md)]',
  'transition-[border-color,box-shadow] duration-150 focus:outline-none',
  'focus:border-[var(--color-brand)] focus:shadow-[0_0_0_3px_var(--color-brand-subtle)]',
].join(' ');

interface InventorySearchProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
}

export function InventorySearch({ filters, onChange }: InventorySearchProps) {
  return (
    <div className="flex flex-col md:flex-row gap-2 md:gap-3 mb-4">
      <div className="relative flex-1">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
        <input
          type="text"
          placeholder="Search by name, SKU, or ID…"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className={`w-full pl-9 pr-3 h-8 placeholder:text-[var(--color-text-tertiary)] ${inputCls}`}
        />
      </div>
      <div className="flex gap-2 md:gap-3">
        <select
          value={filters.category}
          onChange={(e) => onChange({ ...filters, category: e.target.value as FilterState['category'] })}
          className={`flex-1 md:flex-none px-3 h-8 ${inputCls}`}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value as FilterState['status'] })}
          className={`flex-1 md:flex-none px-3 h-8 ${inputCls}`}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
