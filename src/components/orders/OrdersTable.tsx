import type { PurchaseOrder, OrderStatus } from '@/types';
import type { SubComponent } from '@/types';

interface OrdersTableProps {
  orders: PurchaseOrder[];
  components: SubComponent[];
}

const statusStyle: Record<OrderStatus, string> = {
  Delivered: 'bg-green-500/15 text-green-400 border border-green-600/40',
  Pending: 'bg-blue-500/15 text-blue-400 border border-blue-600/40',
  Cancelled: 'bg-slate-500/15 text-slate-400 border border-slate-600/40',
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
            <div key={po.id} className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-3">
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div className="min-w-0">
                  <p className="text-slate-200 text-sm font-semibold leading-tight truncate">{comp?.name ?? po.componentId}</p>
                  <p className="text-slate-500 text-[10px] mt-0.5">{po.id} · {po.supplier}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${statusStyle[po.status]}`}>{po.status}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-900/50 rounded-lg p-2">
                  <p className="text-slate-500 text-[9px] uppercase tracking-wider">Date</p>
                  <p className="text-slate-200 text-[10px] font-medium mt-0.5">{po.date}</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2">
                  <p className="text-slate-500 text-[9px] uppercase tracking-wider">Qty</p>
                  <p className="text-slate-200 text-xs font-semibold mt-0.5">{po.quantityOrdered.toLocaleString()}</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2">
                  <p className="text-slate-500 text-[9px] uppercase tracking-wider">Total</p>
                  <p className="text-slate-200 text-xs font-semibold mt-0.5">${po.totalCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                </div>
              </div>
            </div>
          );
        })}
        {orders.length === 0 && (
          <p className="text-center py-8 text-slate-500 text-sm">No orders match the filters.</p>
        )}
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/50 border-b border-slate-700/60">
              <tr>
                {['PO #', 'Component', 'Supplier', 'Date', 'Delivered', 'Qty', 'Unit Cost', 'Total', 'Status'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((po) => {
                const comp = compMap[po.componentId];
                return (
                  <tr key={po.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                    <td className="px-3 py-3 text-slate-500 text-xs font-mono">{po.id}</td>
                    <td className="px-3 py-3">
                      <div className="text-slate-200 text-xs font-medium">{comp?.name ?? po.componentId}</div>
                      <div className="text-slate-500 text-[10px]">{po.componentId}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-400 text-xs">{po.supplier}</td>
                    <td className="px-3 py-3 text-slate-400 text-xs font-mono">{po.date}</td>
                    <td className="px-3 py-3 text-slate-400 text-xs font-mono">{po.deliveredDate}</td>
                    <td className="px-3 py-3 text-slate-300 font-mono text-xs">{po.quantityOrdered.toLocaleString()}</td>
                    <td className="px-3 py-3 text-slate-400 font-mono text-xs">${po.unitCostAtOrder.toFixed(3)}</td>
                    <td className="px-3 py-3 text-slate-300 font-mono text-xs font-semibold">
                      ${po.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${statusStyle[po.status]}`}>{po.status}</span>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-500 text-sm">No orders match the filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
