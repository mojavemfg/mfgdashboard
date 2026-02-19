import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import type { ConsumptionRecord } from '@/types';

interface ConsumptionTrendChartProps {
  componentId: string;
  componentName: string;
  records: ConsumptionRecord[];
  avgDaily: number;
}

export function ConsumptionTrendChart({
  componentId,
  componentName,
  records,
  avgDaily,
}: ConsumptionTrendChartProps) {
  const data = records
    .filter((r) => r.componentId === componentId)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => ({
      date: r.date.slice(5),
      consumed: r.unitsConsumed,
    }));

  const tickIndices = new Set(data.filter((_, i) => i % 15 === 0).map((d) => d.date));

  return (
    <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4">
      <p className="text-slate-300 text-sm font-semibold mb-1">{componentName}</p>
      <p className="text-slate-500 text-xs mb-4">90-day consumption · avg {avgDaily.toFixed(1)} units/day</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#64748b', fontSize: 10 }}
            tickFormatter={(v) => (tickIndices.has(v) ? v : '')}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 10 }}
            width={36}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, fontSize: 12 }}
            labelStyle={{ color: '#94a3b8' }}
            itemStyle={{ color: '#60a5fa' }}
            formatter={(value: number | undefined) => [value != null ? value.toFixed(1) : '—', 'Units']}
          />
          <ReferenceLine
            y={avgDaily}
            stroke="#f59e0b"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{ value: `avg`, fill: '#f59e0b', fontSize: 9, position: 'insideTopRight' }}
          />
          <Line
            type="monotone"
            dataKey="consumed"
            stroke="#3b82f6"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: '#60a5fa' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
