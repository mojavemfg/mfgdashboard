import type { EtsyOrderItem } from '@/types';

interface EtsyOrdersTableProps {
  items: EtsyOrderItem[];
  activeBuyer: string | null;
  onBuyerClick: (name: string) => void;
}

export function EtsyOrdersTable({ items, activeBuyer, onBuyerClick }: EtsyOrdersTableProps) {
  // Derive order grouping before rendering — keeps render pure
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
            className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 p-3 shadow-sm dark:shadow-none"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="text-slate-900 dark:text-slate-200 text-sm font-semibold leading-tight">{item.itemName}</p>
                <button
                  onClick={() => onBuyerClick(item.shipName)}
                  className={`text-[10px] mt-0.5 hover:underline cursor-pointer bg-transparent border-none p-0 text-left ${
                    activeBuyer === item.shipName ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-400'
                  }`}
                >
                  {item.shipName}
                </button>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                item.dateShipped
                  ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-500/15 dark:text-green-400 dark:border-green-600/40'
                  : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-600/40'
              }`}>
                {item.dateShipped ? 'Shipped' : 'Pending'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Qty', value: item.quantity },
                { label: 'Total', value: `$${item.itemTotal.toFixed(2)}` },
                { label: 'City', value: item.shipCity || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2">
                  <p className="text-slate-400 text-[9px] uppercase tracking-wider">{label}</p>
                  <p className="text-slate-800 dark:text-slate-200 text-[10px] font-semibold mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-center py-8 text-slate-400 text-sm">No items match the filters.</p>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden shadow-sm dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700/60">
              <tr>
                {['Order ID', 'Item', 'Buyer', 'Qty', 'Total', 'Shipped', 'Country'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grouped.map((item) => {
                return (
                  <tr
                    key={item.transactionId}
                    className="border-b border-slate-100 dark:border-slate-700/30 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors"
                  >
                    <td className="px-3 py-3 text-slate-400 text-xs font-mono">
                      {item.isFirstOfOrder ? item.orderId : <span className="text-slate-200 dark:text-slate-700">↳</span>}
                    </td>
                    <td className="px-3 py-3 text-slate-800 dark:text-slate-200 text-xs max-w-xs truncate">{item.itemName}</td>
                    <td className="px-3 py-3 text-xs">
                      <button
                        onClick={() => onBuyerClick(item.shipName)}
                        className={`hover:underline cursor-pointer bg-transparent border-none p-0 text-left ${
                          activeBuyer === item.shipName
                            ? 'text-blue-600 dark:text-blue-400 font-semibold'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {item.shipName}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300 font-mono text-xs">{item.quantity}</td>
                    <td className="px-3 py-3 text-slate-700 dark:text-slate-300 font-mono text-xs font-semibold">
                      ${item.itemTotal.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {item.dateShipped ? (
                        <span className="text-green-600 dark:text-green-400 font-mono">{item.dateShipped}</span>
                      ) : (
                        <span className="text-blue-500 dark:text-blue-400">Pending</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-slate-500 dark:text-slate-400 text-xs">{item.shipCountry}</td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 text-sm">
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
