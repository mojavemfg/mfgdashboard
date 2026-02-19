import type { PurchaseOrder, OrderStatus, SubComponent } from '@/types';

interface OrdersTableProps {
  orders: PurchaseOrder[];
  components: SubComponent[];
}

const statusStyle: Record<OrderStatus, string> = {
  Delivered: 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-500/15 dark:text-green-400 dark:border-green-600/40',
  Pending: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-600/40',
  Cancelled: 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-500/15 dark:text-slate-400 dark:border-slate-600/40',
};

export function OrdersTable({ orders, components }: OrdersTableProps) {
  const compMap = Object.fromEntries(components.map((c) => [c.id, c]));

  return (
    <>
      {/* Mobile card view */}
      <div className="sm:hidden flex flex-col gap-2">
        {orders.map((po) => {
          const comp = compMap[po.componentId];
          return (
            <div key={po.id} className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 p-3 shadow-sm dark:shadow-none">
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div className="min-w-0">
                  <p className="text-slate-900 dark:text-slate-200 text-sm font-semibold leading-tight truncate">{comp?.name ?? po.componentId}</p>
                  <p className="text-slate-400 text-[10px] mt-0.5">{po.id} · {po.supplier}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${statusStyle[po.status]}`}>{po.status}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Date', value: po.date },
                  { label: 'Qty', value: po.quantityOrdered.toLocaleString() },
                  { label: 'Total', value: `$${po.totalCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2">
                    <p className="text-slate-400 text-[9px] uppercase tracking-wider">{label}</p>
                    <p className="text-slate-800 dark:text-slate-200 text-[10px] font-semibold mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {orders.length === 0 && <p className="text-center py-8 text-slate-400 text-sm">No orders match the filters.</p>}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden shadow-sm dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700/60">
              <tr>
                {['PO #', 'Component', 'Supplier', 'Date', 'Delivered', 'Qty', 'Unit Cost', 'Total', 'Status'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((po) => {
                const comp = compMap[po.componentId];
                return (
                  <tr key={po.id} className="border-b border-slate-100 dark:border-slate-700/30 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                    <td className="px-3 py-3 text-slate-400 text-xs font-mono">{po.id}</td>
                    <td className="px-3 py-3">
                      <div className="text-slate-800 dark:text-slate-200 text-xs font-medium">{comp?.name ?? po.componentId}</div>
                      <div className="text-slate-400 text-[10px]">{po.componentId}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-500 dark:text-slate-400 text-xs">{po.supplier}</td>
                    <td className="px-3 py-3 text-slate-500 dark:text-slate-400 text-xs font-mono">{po.date}</td>
                    <td className="px-3 py-3 text-slate-500 dark:text-slate-400 text-xs font-mono">{po.deliveredDate}</td>
                    <td className="px-3 py-3 text-slate-700 dark:text-slate-300 font-mono text-xs">{po.quantityOrdered.toLocaleString()}</td>
                    <td className="px-3 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">${po.unitCostAtOrder.toFixed(3)}</td>
                    <td className="px-3 py-3 text-slate-700 dark:text-slate-300 font-mono text-xs font-semibold">
                      ${po.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${statusStyle[po.status]}`}>{po.status}</span>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr><td colSpan={9} className="text-center py-10 text-slate-400 text-sm">No orders match the filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
