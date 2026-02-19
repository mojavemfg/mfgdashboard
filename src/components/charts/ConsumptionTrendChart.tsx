import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, ReferenceLine, CartesianGrid,
} from 'recharts';
import type { ConsumptionRecord } from '@/types';

interface ConsumptionTrendChartProps {
  componentId: string;
  componentName: string;
  records: ConsumptionRecord[];
  avgDaily: number;
  isDark: boolean;
}

export function ConsumptionTrendChart({ componentId, componentName, records, avgDaily, isDark }: ConsumptionTrendChartProps) {
  const data = records
    .filter((r) => r.componentId === componentId)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => ({ date: r.date.slice(5), consumed: r.unitsConsumed }));

  const tickIndices = new Set(data.filter((_, i) => i % 15 === 0).map((d) => d.date));

  const grid = isDark ? '#1e293b' : '#e2e8f0';
  const tick = isDark ? '#64748b' : '#94a3b8';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#1e293b' : '#e2e8f0';
  const tooltipLabel = isDark ? '#94a3b8' : '#475569';

  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 p-4 shadow-sm dark:shadow-none">
      <p className="text-slate-800 dark:text-slate-300 text-sm font-semibold mb-1">{componentName}</p>
      <p className="text-slate-400 text-xs mb-4">90-day consumption · avg {avgDaily.toFixed(1)} units/day</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} />
          <XAxis dataKey="date" tick={{ fill: tick, fontSize: 10 }} tickFormatter={(v) => (tickIndices.has(v) ? v : '')} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: tick, fontSize: 10 }} width={36} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 10, fontSize: 12 }}
            labelStyle={{ color: tooltipLabel }}
            itemStyle={{ color: '#3b82f6' }}
            formatter={(value: number | undefined) => [value != null ? value.toFixed(1) : '—', 'Units']}
          />
          <ReferenceLine y={avgDaily} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5}
            label={{ value: 'avg', fill: '#f59e0b', fontSize: 9, position: 'insideTopRight' }} />
          <Line type="monotone" dataKey="consumed" stroke="#3b82f6" strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: '#60a5fa' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
