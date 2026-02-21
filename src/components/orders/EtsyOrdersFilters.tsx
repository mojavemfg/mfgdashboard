import { Search } from 'lucide-react';
import { Select } from '@/components/ui/Input';

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
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search item, buyer, city…"
          className={[
            'h-8 w-full pl-8 pr-3 text-sm rounded-[var(--radius-md)]',
            'bg-[var(--color-bg)] border border-[var(--color-border)]',
            'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]',
            'transition-[border-color,box-shadow] duration-150 focus:outline-none',
            'focus:border-[var(--color-brand)] focus:shadow-[0_0_0_3px_var(--color-brand-subtle)]',
          ].join(' ')}
        />
      </div>

      {/* Country */}
      <Select
        value={filters.country}
        onChange={(e) => onChange({ ...filters, country: e.target.value })}
        className="w-auto min-w-[140px]"
      >
        <option value="All">All Countries</option>
        {countries.map((c) => <option key={c} value={c}>{c}</option>)}
      </Select>

      {/* Shipped toggle */}
      <Select
        value={filters.shipped}
        onChange={(e) => onChange({ ...filters, shipped: e.target.value as EtsyFilterState['shipped'] })}
        className="w-auto min-w-[130px]"
      >
        <option value="all">All Statuses</option>
        <option value="shipped">Shipped</option>
        <option value="unshipped">Unshipped</option>
      </Select>
    </div>
  );
}
