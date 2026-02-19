import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import type { ComponentWithMetrics } from '@/types';

interface InventoryLevelChartProps {
  components: ComponentWithMetrics[];
}

export function InventoryLevelChart({ components }: InventoryLevelChartProps) {
  const data = [...components]
    .sort((a, b) => {
      const ad = a.daysUntilReorder === Infinity ? 9999 : a.daysUntilReorder;
      const bd = b.daysUntilReorder === Infinity ? 9999 : b.daysUntilReorder;
      return ad - bd;
    })
    .slice(0, 10)
    .map((c) => ({
      name: c.id.replace('COMP-', '#'),
      fullName: c.name,
      stock: c.currentStock,
      reorderPoint: Math.round(c.reorderPoint),
      status: c.status,
    }));

  const barColor = (status: string) => {
    if (status === 'Critical') return '#ef4444';
    if (status === 'Warning') return '#eab308';
    return '#22c55e';
  };

  return (
    <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4">
      <p className="text-slate-300 text-sm font-semibold mb-1">Stock vs Reorder Point</p>
      <p className="text-slate-500 text-xs mb-4">Top 10 most at-risk components</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 10 }}
            width={40}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, fontSize: 12 }}
            labelStyle={{ color: '#94a3b8' }}
            itemStyle={{ fontSize: 12 }}
            formatter={(value: number | undefined, name: string | undefined) => [
              value != null ? value.toLocaleString() : '—',
              name === 'stock' ? 'Current Stock' : 'Reorder Point',
            ]}
            labelFormatter={(label) => {
              const labelStr = String(label);
              const item = data.find((d) => d.name === labelStr);
              return item ? item.fullName : labelStr;
            }}
          />
          <Bar dataKey="stock" name="stock" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={barColor(entry.status)} fillOpacity={0.85} />
            ))}
          </Bar>
          <Bar dataKey="reorderPoint" name="reorderPoint" fill="#334155" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-3 justify-center">
        <span className="flex items-center gap-1.5 text-[10px] text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" />Critical</span>
        <span className="flex items-center gap-1.5 text-[10px] text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-yellow-500 inline-block" />Warning</span>
        <span className="flex items-center gap-1.5 text-[10px] text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" />OK</span>
        <span className="flex items-center gap-1.5 text-[10px] text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-slate-500 inline-block" />Reorder Pt</span>
      </div>
    </div>
  );
}
