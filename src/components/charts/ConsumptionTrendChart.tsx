import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Legend,
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
      date: r.date.slice(5), // MM-DD
      fullDate: r.date,
      consumed: r.unitsConsumed,
    }));

  // Show every 10th tick label to avoid crowding
  const tickIndices = new Set(data.filter((_, i) => i % 10 === 0).map((d) => d.date));

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
      <p className="text-slate-300 text-sm font-medium mb-4">{componentName} — 90-Day Consumption</p>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            tickFormatter={(v) => (tickIndices.has(v) ? v : '')}
          />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} width={40} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
            labelStyle={{ color: '#cbd5e1', fontSize: 12 }}
            itemStyle={{ color: '#60a5fa' }}
            formatter={(value: number | undefined) => [value != null ? value.toFixed(1) : '—', 'Units']}
          />
          <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
          <ReferenceLine
            y={avgDaily}
            stroke="#f59e0b"
            strokeDasharray="5 5"
            label={{ value: `Avg ${avgDaily.toFixed(1)}/day`, fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }}
          />
          <Line
            type="monotone"
            dataKey="consumed"
            stroke="#60a5fa"
            strokeWidth={1.5}
            dot={false}
            name="Units Consumed"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
