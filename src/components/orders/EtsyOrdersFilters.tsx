import { Search } from 'lucide-react';

export interface EtsyFilterState {
  search: string;
  country: string;
  shipped: 'all' | 'shipped' | 'unshipped';
}

interface EtsyOrdersFiltersProps {
  filters: EtsyFilterState;
  countries: string[];
  onChange: (f: EtsyFilterState) => void;
}

export function EtsyOrdersFilters({ filters, countries, onChange }: EtsyOrdersFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {/* Search */}
      <div className="relative flex-1 min-w-40">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search item, buyer, city…"
          className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
      </div>

      {/* Country */}
      <select
        value={filters.country}
        onChange={(e) => onChange({ ...filters, country: e.target.value })}
        className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      >
        <option value="All">All Countries</option>
        {countries.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {/* Shipped toggle */}
      <select
        value={filters.shipped}
        onChange={(e) => onChange({ ...filters, shipped: e.target.value as EtsyFilterState['shipped'] })}
        className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      >
        <option value="all">All Statuses</option>
        <option value="shipped">Shipped</option>
        <option value="unshipped">Unshipped</option>
      </select>
    </div>
  );
}
