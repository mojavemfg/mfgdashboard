import { Search } from 'lucide-react';
import type { OrderStatus } from '@/types';

export interface OrderFilterState {
  search: string;
  status: OrderStatus | 'All';
  supplier: string;
}

const STATUSES: (OrderStatus | 'All')[] = ['All', 'Delivered', 'Pending', 'Cancelled'];

const inputCls = 'bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-slate-200 text-sm rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/60 transition-colors';

interface OrdersFiltersProps {
  filters: OrderFilterState;
  suppliers: string[];
  onChange: (f: OrderFilterState) => void;
}

export function OrdersFilters({ filters, suppliers, onChange }: OrdersFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
      <div className="relative flex-1">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search orders, components, suppliers…"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className={`w-full pl-9 pr-3 py-2.5 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${inputCls}`}
        />
      </div>
      <div className="flex gap-2 sm:gap-3">
        <select value={filters.status} onChange={(e) => onChange({ ...filters, status: e.target.value as OrderFilterState['status'] })} className={`flex-1 sm:flex-none px-3 py-2.5 ${inputCls}`}>
          {STATUSES.map((s) => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
        </select>
        <select value={filters.supplier} onChange={(e) => onChange({ ...filters, supplier: e.target.value })} className={`flex-1 sm:flex-none px-3 py-2.5 ${inputCls}`}>
          <option value="All">All Suppliers</option>
          {suppliers.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </div>
  );
}
