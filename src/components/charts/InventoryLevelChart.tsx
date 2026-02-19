import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Cell,
} from 'recharts';
import type { ComponentWithMetrics } from '@/types';

interface InventoryLevelChartProps {
  components: ComponentWithMetrics[];
  isDark: boolean;
}

export function InventoryLevelChart({ components, isDark }: InventoryLevelChartProps) {
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

  const barColor = (status: string) =>
    status === 'Critical' ? '#ef4444' : status === 'Warning' ? '#eab308' : '#22c55e';

  const grid = isDark ? '#1e293b' : '#e2e8f0';
  const tick = isDark ? '#64748b' : '#94a3b8';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#1e293b' : '#e2e8f0';
  const tooltipLabel = isDark ? '#94a3b8' : '#475569';
  const reorderBarFill = isDark ? '#334155' : '#cbd5e1';

  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 p-4 shadow-sm dark:shadow-none">
      <p className="text-slate-800 dark:text-slate-300 text-sm font-semibold mb-1">Stock vs Reorder Point</p>
      <p className="text-slate-400 text-xs mb-4">Top 10 most at-risk components</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: tick, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: tick, fontSize: 10 }} width={40} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 10, fontSize: 12 }}
            labelStyle={{ color: tooltipLabel }}
            formatter={(value: number | undefined, name: string | undefined) => [
              value != null ? value.toLocaleString() : '—',
              name === 'stock' ? 'Current Stock' : 'Reorder Point',
            ]}
            labelFormatter={(label) => {
              const s = String(label);
              return data.find((d) => d.name === s)?.fullName ?? s;
            }}
          />
          <Bar dataKey="stock" name="stock" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {data.map((entry, i) => <Cell key={`cell-${i}`} fill={barColor(entry.status)} fillOpacity={0.85} />)}
          </Bar>
          <Bar dataKey="reorderPoint" name="reorderPoint" fill={reorderBarFill} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-3 justify-center">
        {[['bg-red-500', 'Critical'], ['bg-yellow-500', 'Warning'], ['bg-green-500', 'OK'], ['bg-slate-400 dark:bg-slate-500', 'Reorder Pt']].map(([color, label]) => (
          <span key={label} className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className={`w-2.5 h-2.5 rounded-sm ${color} inline-block`} />{label}
          </span>
        ))}
      </div>
    </div>
  );
}
