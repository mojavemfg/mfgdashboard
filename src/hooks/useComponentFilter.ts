import { useState, useMemo } from 'react';
import type { ComponentWithMetrics, ComponentCategory, ReorderStatus } from '@/types';

export interface FilterState {
  search: string;
  category: ComponentCategory | 'All';
  status: ReorderStatus | 'All';
}

export function useComponentFilter(components: ComponentWithMetrics[]) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: 'All',
    status: 'All',
  });

  const filtered = useMemo(() => {
    return components.filter((c) => {
      const matchesSearch =
        filters.search === '' ||
        c.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        c.sku.toLowerCase().includes(filters.search.toLowerCase()) ||
        c.id.toLowerCase().includes(filters.search.toLowerCase());

      const matchesCategory = filters.category === 'All' || c.category === filters.category;
      const matchesStatus = filters.status === 'All' || c.status === filters.status;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [components, filters]);

  return { filters, setFilters, filtered };
}
