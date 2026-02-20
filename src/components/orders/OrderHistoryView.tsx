import { useState, useMemo } from 'react';
import { ShoppingBag, X } from 'lucide-react';
import { SalesMapUpload } from '@/components/salesmap/SalesMapUpload';
import { EtsyOrdersFilters } from './EtsyOrdersFilters';
import { EtsyOrdersTable } from './EtsyOrdersTable';
import type { EtsyFilterState } from './EtsyOrdersFilters';
import type { EtsyOrderItem } from '@/types';
import type { MergeResult } from '@/hooks/useSalesOrders';

interface OrderHistoryViewProps {
  orders: EtsyOrderItem[];
  onMerge: (records: EtsyOrderItem[]) => MergeResult;
  onClear: () => void;
}

export function OrderHistoryView({ orders, onMerge, onClear }: OrderHistoryViewProps) {
  const [filters, setFilters] = useState<EtsyFilterState>({
    search: '',
    country: 'All',
    shipped: 'all',
  });
  const [activeBuyer, setActiveBuyer] = useState<string | null>(null);

  const countries = useMemo(
    () => Array.from(new Set(orders.map((o) => o.shipCountry).filter(Boolean))).sort(),
    [orders],
  );

  const filtered = useMemo(() => {
    return orders.filter((item) => {
      const q = filters.search.toLowerCase();
      const matchesSearch =
        q === '' ||
        item.itemName.toLowerCase().includes(q) ||
        item.shipName.toLowerCase().includes(q) ||
        item.shipCity.toLowerCase().includes(q);

      const matchesCountry = filters.country === 'All' || item.shipCountry === filters.country;

      const matchesShipped =
        filters.shipped === 'all' ||
        (filters.shipped === 'shipped' && item.dateShipped !== '') ||
        (filters.shipped === 'unshipped' && item.dateShipped === '');

      const matchesBuyer = activeBuyer === null || item.shipName === activeBuyer;

      return matchesSearch && matchesCountry && matchesShipped && matchesBuyer;
    });
  }, [orders, filters, activeBuyer]);

  // Summary stats for active buyer chip
  const buyerSummary = useMemo(() => {
    if (!activeBuyer) return null;
    const buyerItems = orders.filter((o) => o.shipName === activeBuyer);
    const uniqueOrders = new Set(buyerItems.map((o) => o.orderId)).size;
    const total = buyerItems.reduce((sum, o) => sum + o.itemTotal, 0);
    return { uniqueOrders, total };
  }, [activeBuyer, orders]);

  const uniqueOrderCount = useMemo(
    () => new Set(filtered.map((o) => o.orderId)).size,
    [filtered],
  );

  function handleBuyerClick(name: string) {
    setActiveBuyer((prev) => (prev === name ? null : name));
  }

  return (
    <div>
      {/* Upload zone — always visible */}
      <div className="mb-4">
        <SalesMapUpload onMerge={onMerge} onClear={onClear} totalItems={orders.length} />
      </div>

      {orders.length === 0 ? (
        // Empty state
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
          <ShoppingBag size={48} className="mb-4 opacity-30" />
          <p className="text-base font-medium">No order history yet</p>
          <p className="text-sm mt-1">Upload an Etsy sold-order-items CSV above to get started</p>
        </div>
      ) : (
        <>
          <EtsyOrdersFilters filters={filters} countries={countries} onChange={setFilters} />

          {/* Active buyer chip */}
          {activeBuyer && buyerSummary && (
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-600/40 rounded-full text-xs font-medium">
                {activeBuyer}
                <span className="text-blue-500 dark:text-blue-500">·</span>
                {buyerSummary.uniqueOrders} {buyerSummary.uniqueOrders === 1 ? 'order' : 'orders'}
                <span className="text-blue-500 dark:text-blue-500">·</span>
                ${buyerSummary.total.toFixed(2)} total
                <button
                  onClick={() => setActiveBuyer(null)}
                  className="ml-1 hover:text-blue-900 dark:hover:text-blue-200 cursor-pointer bg-transparent border-none p-0"
                >
                  <X size={12} />
                </button>
              </span>
            </div>
          )}

          {/* Summary line */}
          <p className="text-slate-500 dark:text-slate-400 text-xs mb-2">
            Showing {filtered.length} {filtered.length === 1 ? 'item' : 'items'} across {uniqueOrderCount} {uniqueOrderCount === 1 ? 'order' : 'orders'}
          </p>

          <EtsyOrdersTable items={filtered} activeBuyer={activeBuyer} onBuyerClick={handleBuyerClick} />
        </>
      )}
    </div>
  );
}
