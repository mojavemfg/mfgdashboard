import type { EtsyOrderItem } from '@/types';
import { Badge } from '@/components/ui/Badge';

interface EtsyOrdersTableProps {
  items: EtsyOrderItem[];
  activeBuyer: string | null;
  onBuyerClick: (name: string) => void;
}

export function EtsyOrdersTable({ items, activeBuyer, onBuyerClick }: EtsyOrdersTableProps) {
  const seen = new Set<string>();
  const grouped = items.map((item) => {
    const isFirstOfOrder = !seen.has(item.orderId);
    if (isFirstOfOrder) seen.add(item.orderId);
    return { ...item, isFirstOfOrder };
  });

  return (
    <>
      {/* Mobile card view */}
      <div className="sm:hidden flex flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.transactionId}
            className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-3"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)] leading-tight">{item.itemName}</p>
                <button
                  onClick={() => onBuyerClick(item.shipName)}
                  className={[
                    'text-xs mt-0.5 hover:underline cursor-pointer bg-transparent border-none p-0 text-left transition-colors',
                    activeBuyer === item.shipName
                      ? 'text-[var(--color-brand)] font-medium'
                      : 'text-[var(--color-text-tertiary)]',
                  ].join(' ')}
                >
                  {item.shipName}
                </button>
              </div>
              <Badge variant={item.dateShipped ? 'success' : 'info'}>
                {item.dateShipped ? 'Shipped' : 'Pending'}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Qty',   value: item.quantity },
                { label: 'Total', value: `$${item.itemTotal.toFixed(2)}` },
                { label: 'City',  value: item.shipCity || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[var(--color-bg-subtle)] rounded-[var(--radius-md)] p-2">
                  <p className="text-[9px] uppercase tracking-wide text-[var(--color-text-tertiary)]">{label}</p>
                  <p className="text-xs font-medium mt-0.5 text-[var(--color-text-primary)]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-center py-8 text-sm text-[var(--color-text-tertiary)]">No items match the filters.</p>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--color-bg-subtle)]">
              <tr>
                {['Order ID', 'Item', 'Buyer', 'Qty', 'Total', 'Shipped', 'Country'].map((h) => (
                  <th
                    key={h}
                    className="h-9 px-4 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide border-b border-[var(--color-border)] whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-[var(--color-bg)]">
              {grouped.map((item) => (
                <tr
                  key={item.transactionId}
                  className="group border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-subtle)] transition-colors duration-100"
                >
                  <td className="h-11 px-4 text-xs font-mono text-[var(--color-text-tertiary)]">
                    {item.isFirstOfOrder
                      ? item.orderId
                      : <span className="opacity-30">↳</span>
                    }
                  </td>
                  <td className="h-11 px-4 text-sm text-[var(--color-text-primary)] max-w-xs truncate">
                    {item.itemName}
                  </td>
                  <td className="h-11 px-4 text-sm">
                    <button
                      onClick={() => onBuyerClick(item.shipName)}
                      className={[
                        'hover:underline cursor-pointer bg-transparent border-none p-0 text-left transition-colors',
                        activeBuyer === item.shipName
                          ? 'text-[var(--color-brand)] font-medium'
                          : 'text-[var(--color-text-secondary)]',
                      ].join(' ')}
                    >
                      {item.shipName}
                    </button>
                  </td>
                  <td className="h-11 px-4 text-sm font-mono text-[var(--color-text-secondary)]">{item.quantity}</td>
                  <td className="h-11 px-4 text-sm font-mono font-semibold text-[var(--color-text-primary)]">
                    ${item.itemTotal.toFixed(2)}
                  </td>
                  <td className="h-11 px-4 text-sm">
                    {item.dateShipped ? (
                      <span className="font-mono text-xs text-[var(--color-success)]">{item.dateShipped}</span>
                    ) : (
                      <Badge variant="info">Pending</Badge>
                    )}
                  </td>
                  <td className="h-11 px-4 text-sm text-[var(--color-text-secondary)]">{item.shipCountry}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-[var(--color-text-tertiary)]">
                    No items match the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
