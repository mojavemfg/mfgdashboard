import { useState, useMemo } from 'react';
import { purchaseOrders } from '@/data';
import { components } from '@/data/components';
import { OrdersTable } from './OrdersTable';
import { OrdersFilters } from './OrdersFilters';
import type { OrderFilterState } from './OrdersFilters';

export function OrdersView() {
  const [filters, setFilters] = useState<OrderFilterState>({
    search: '',
    status: 'All',
    supplier: 'All',
  });

  const suppliers = useMemo(
    () => Array.from(new Set(purchaseOrders.map((po) => po.supplier))).sort(),
    [],
  );

  const compMap = useMemo(
    () => Object.fromEntries(components.map((c) => [c.id, c])),
    [],
  );

  const filtered = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const comp = compMap[po.componentId];
      const matchesSearch =
        filters.search === '' ||
        po.id.toLowerCase().includes(filters.search.toLowerCase()) ||
        (comp?.name ?? '').toLowerCase().includes(filters.search.toLowerCase()) ||
        po.supplier.toLowerCase().includes(filters.search.toLowerCase());

      const matchesStatus = filters.status === 'All' || po.status === filters.status;
      const matchesSupplier = filters.supplier === 'All' || po.supplier === filters.supplier;

      return matchesSearch && matchesStatus && matchesSupplier;
    });
  }, [filters, compMap]);

  return (
    <div>
      <OrdersFilters filters={filters} suppliers={suppliers} onChange={setFilters} />
      <OrdersTable orders={filtered} components={components} />
      <p className="text-slate-500 text-xs mt-2">Showing {filtered.length} of {purchaseOrders.length} orders</p>
    </div>
  );
}
