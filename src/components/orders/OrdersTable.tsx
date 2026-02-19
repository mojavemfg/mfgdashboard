import type { PurchaseOrder, OrderStatus } from '@/types';
import type { SubComponent } from '@/types';

interface OrdersTableProps {
  orders: PurchaseOrder[];
  components: SubComponent[];
}

const statusStyle: Record<OrderStatus, string> = {
  Delivered: 'bg-green-500/20 text-green-400 border border-green-700',
  Pending: 'bg-blue-500/20 text-blue-400 border border-blue-700',
  Cancelled: 'bg-slate-500/20 text-slate-400 border border-slate-600',
};

export function OrdersTable({ orders, components }: OrdersTableProps) {
  const compMap = Object.fromEntries(components.map((c) => [c.id, c]));

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/60 border-b border-slate-700">
            <tr>
              {['PO #', 'Component', 'Supplier', 'Date', 'Delivered', 'Qty', 'Unit Cost', 'Total', 'Status'].map((h) => (
                <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((po) => {
              const comp = compMap[po.componentId];
              return (
                <tr key={po.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="px-3 py-2.5 text-slate-500 text-xs font-mono">{po.id}</td>
                  <td className="px-3 py-2.5">
                    <div className="text-slate-200 text-xs font-medium">{comp?.name ?? po.componentId}</div>
                    <div className="text-slate-500 text-xs">{po.componentId}</div>
                  </td>
                  <td className="px-3 py-2.5 text-slate-400 text-xs">{po.supplier}</td>
                  <td className="px-3 py-2.5 text-slate-400 text-xs font-mono">{po.date}</td>
                  <td className="px-3 py-2.5 text-slate-400 text-xs font-mono">{po.deliveredDate}</td>
                  <td className="px-3 py-2.5 text-slate-300 font-mono text-xs">{po.quantityOrdered.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-slate-400 font-mono text-xs">${po.unitCostAtOrder.toFixed(3)}</td>
                  <td className="px-3 py-2.5 text-slate-300 font-mono text-xs font-semibold">
                    ${po.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${statusStyle[po.status]}`}>{po.status}</span>
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-8 text-slate-500 text-sm">No orders match the filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
