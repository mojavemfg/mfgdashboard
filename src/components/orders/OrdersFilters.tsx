import { Search } from 'lucide-react';
import type { OrderStatus } from '@/types';

export interface OrderFilterState {
  search: string;
  status: OrderStatus | 'All';
  supplier: string;
}

const STATUSES: (OrderStatus | 'All')[] = ['All', 'Delivered', 'Pending', 'Cancelled'];

interface OrdersFiltersProps {
  filters: OrderFilterState;
  suppliers: string[];
  onChange: (f: OrderFilterState) => void;
}

export function OrdersFilters({ filters, suppliers, onChange }: OrdersFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <div className="relative flex-1 min-w-48">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search orders…"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded-lg pl-9 pr-3 py-2 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>
      <select
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value as OrderFilterState['status'] })}
        className="bg-slate-800 border border-slate-600 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
        ))}
      </select>
      <select
        value={filters.supplier}
        onChange={(e) => onChange({ ...filters, supplier: e.target.value })}
        className="bg-slate-800 border border-slate-600 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
      >
        <option value="All">All Suppliers</option>
        {suppliers.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  );
}
