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
  const [filters, setFilters] = useState<EtsyFilterState>({ search: '', country: 'All', shipped: 'all' });
  const [activeBuyer, setActiveBuyer] = useState<string | null>(null);

  const countries = useMemo(
    () => Array.from(new Set(orders.map((o) => o.shipCountry).filter(Boolean))).sort(),
    [orders],
  );

  const filtered = useMemo(() => orders.filter((item) => {
    const q = filters.search.toLowerCase();
    const matchesSearch =
      q === '' ||
      item.itemName.toLowerCase().includes(q) ||
      item.shipName.toLowerCase().includes(q) ||
      item.shipCity.toLowerCase().includes(q);
    const matchesCountry = filters.country === 'All' || item.shipCountry === filters.country;
    const matchesShipped =
      filters.shipped === 'all' ||
      (filters.shipped === 'shipped'   && item.dateShipped !== '') ||
      (filters.shipped === 'unshipped' && item.dateShipped === '');
    const matchesBuyer = activeBuyer === null || item.shipName === activeBuyer;
    return matchesSearch && matchesCountry && matchesShipped && matchesBuyer;
  }), [orders, filters, activeBuyer]);

  const buyerSummary = useMemo(() => {
    if (!activeBuyer) return null;
    const buyerItems  = orders.filter((o) => o.shipName === activeBuyer);
    const uniqueOrders = new Set(buyerItems.map((o) => o.orderId)).size;
    const total        = buyerItems.reduce((sum, o) => sum + o.itemTotal, 0);
    return { uniqueOrders, total };
  }, [activeBuyer, orders]);

  const uniqueOrderCount = useMemo(() => new Set(filtered.map((o) => o.orderId)).size, [filtered]);

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">Order History</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            Import and browse Etsy order exports
          </p>
        </div>
      </div>

      <div className="mb-4">
        <SalesMapUpload onMerge={onMerge} onClear={onClear} totalItems={orders.length} />
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--color-text-tertiary)]">
          <ShoppingBag size={32} className="mb-3" />
          <p className="text-sm font-medium text-[var(--color-text-primary)]">No order history yet</p>
          <p className="text-sm mt-1">Upload an Etsy sold-order-items CSV above to get started</p>
        </div>
      ) : (
        <>
          <EtsyOrdersFilters filters={filters} countries={countries} onChange={setFilters} />

          {/* Active buyer chip */}
          {activeBuyer && buyerSummary && (
            <div className="flex items-center gap-2 mb-2 mt-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--color-brand-subtle)] text-[var(--color-brand)] border border-[var(--color-brand-border)] rounded-[var(--radius-full)] text-xs font-medium">
                {activeBuyer}
                <span className="opacity-50">·</span>
                {buyerSummary.uniqueOrders} {buyerSummary.uniqueOrders === 1 ? 'order' : 'orders'}
                <span className="opacity-50">·</span>
                ${buyerSummary.total.toFixed(2)} total
                <button
                  onClick={() => setActiveBuyer(null)}
                  className="ml-1 hover:opacity-70 cursor-pointer bg-transparent border-none p-0 transition-opacity"
                >
                  <X size={12} />
                </button>
              </span>
            </div>
          )}

          {/* Count line */}
          <p className="text-xs text-[var(--color-text-tertiary)] mb-2 mt-3">
            {filtered.length} {filtered.length === 1 ? 'item' : 'items'} across {uniqueOrderCount} {uniqueOrderCount === 1 ? 'order' : 'orders'}
          </p>

          <EtsyOrdersTable items={filtered} activeBuyer={activeBuyer} onBuyerClick={(name) => setActiveBuyer((prev) => prev === name ? null : name)} />
        </>
      )}
    </div>
  );
}
