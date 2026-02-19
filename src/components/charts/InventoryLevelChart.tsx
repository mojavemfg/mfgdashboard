import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from 'recharts';
import type { ComponentWithMetrics } from '@/types';

interface InventoryLevelChartProps {
  components: ComponentWithMetrics[];
}

export function InventoryLevelChart({ components }: InventoryLevelChartProps) {
  // Show top 10 most at-risk (lowest daysUntilReorder)
  const data = [...components]
    .sort((a, b) => {
      const ad = a.daysUntilReorder === Infinity ? 9999 : a.daysUntilReorder;
      const bd = b.daysUntilReorder === Infinity ? 9999 : b.daysUntilReorder;
      return ad - bd;
    })
    .slice(0, 10)
    .map((c) => ({
      name: c.id,
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
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
      <p className="text-slate-300 text-sm font-medium mb-4">Stock vs Reorder Point — Top 10 At-Risk</p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} width={50} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
            labelStyle={{ color: '#cbd5e1', fontSize: 12 }}
            itemStyle={{ fontSize: 12 }}
            formatter={(value: number | undefined, name: string | undefined) => [value != null ? value.toLocaleString() : '—', name === 'stock' ? 'Current Stock' : 'Reorder Point']}
            labelFormatter={(label) => {
              const labelStr = String(label);
              const item = data.find((d) => d.name === labelStr);
              return item ? `${labelStr}: ${item.fullName}` : labelStr;
            }}
          />
          <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
          <Bar dataKey="stock" name="Current Stock" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={barColor(entry.status)} />
            ))}
          </Bar>
          <Bar dataKey="reorderPoint" name="Reorder Point" fill="#475569" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
