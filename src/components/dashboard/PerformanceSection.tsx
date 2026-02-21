import { BarChart2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { KpiCard } from '@/components/kpi/KpiCard';
import type { SalesMetrics } from '@/hooks/useDashboardSalesMetrics';

interface PerformanceSectionProps {
  metrics: SalesMetrics;
  isDark: boolean;
}

function fmtCurrency(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function PerformanceSection({ metrics, isDark }: PerformanceSectionProps) {
  const { revenue30d, revenueAllTime, orders30d, avgOrderValue, monthlyRevenue, topItems } = metrics;

  if (revenueAllTime === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-lg)]">
        <BarChart2 size={32} className="text-[var(--color-text-tertiary)] mb-3" />
        <p className="text-sm font-medium text-[var(--color-text-primary)]">No order data yet</p>
        <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
          Upload an Etsy orders CSV on the Orders tab
        </p>
      </div>
    );
  }

  const gridStroke   = isDark ? '#27272a' : '#e4e4e7';
  const tickFill     = isDark ? '#71717a' : '#a1a1aa';
  const tooltipStyle = {
    fontSize: 12,
    borderRadius: 6,
    background: isDark ? '#09090b' : '#ffffff',
    border: `1px solid ${isDark ? '#27272a' : '#e4e4e7'}`,
    color: isDark ? '#fafafa' : '#0a0a0b',
  };

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Revenue (30 days)"  value={`$${fmtCurrency(revenue30d)}`} />
        <KpiCard label="Revenue (All Time)" value={`$${fmtCurrency(revenueAllTime)}`} />
        <KpiCard label="Orders (30 days)"   value={orders30d} />
        <KpiCard label="Avg Order Value"    value={`$${avgOrderValue.toFixed(2)}`} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Monthly revenue bar chart */}
        <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
            Monthly Revenue
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={monthlyRevenue} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: tickFill }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: tickFill }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Revenue']}
                contentStyle={tooltipStyle}
                cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
              />
              <Bar dataKey="revenue" fill="var(--color-brand)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top items */}
        <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
            Top Items by Revenue
          </h3>
          {topItems.length === 0 ? (
            <p className="text-sm text-[var(--color-text-tertiary)]">No item data</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide pb-2">Item</th>
                  <th className="text-right text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide pb-2">Units</th>
                  <th className="text-right text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide pb-2">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {topItems.map((item) => (
                  <tr key={item.name}>
                    <td className="py-2 pr-2 text-sm text-[var(--color-text-secondary)] truncate max-w-[160px]">
                      {item.name}
                    </td>
                    <td className="py-2 text-right text-sm text-[var(--color-text-tertiary)] tabular-nums">
                      {item.units}
                    </td>
                    <td className="py-2 text-right text-sm font-semibold text-[var(--color-text-primary)] tabular-nums font-mono">
                      ${item.revenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
