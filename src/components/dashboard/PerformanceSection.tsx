import { BarChart2, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
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
  const { revenue30d, revenueAllTime, orders30d, avgOrderValue, monthlyRevenue, topItems } =
    metrics;

  if (revenueAllTime === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/50">
        <BarChart2 size={36} className="mb-3 opacity-40" />
        <p className="text-sm font-medium">No order data yet</p>
        <p className="text-xs mt-1">Upload an Etsy orders CSV on the Orders tab</p>
      </div>
    );
  }

  const gridStroke = isDark ? '#334155' : '#e2e8f0';
  const tickFill = isDark ? '#94a3b8' : '#64748b';
  const tooltipStyle = {
    fontSize: 12,
    borderRadius: 8,
    background: isDark ? '#1e293b' : '#fff',
    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
  };

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="Revenue (30 days)"
          value={`$${fmtCurrency(revenue30d)}`}
          icon={<DollarSign size={20} />}
          accent="green"
        />
        <KpiCard
          label="Revenue (All Time)"
          value={`$${fmtCurrency(revenueAllTime)}`}
          icon={<DollarSign size={20} />}
          accent="blue"
        />
        <KpiCard
          label="Orders (30 days)"
          value={orders30d}
          icon={<ShoppingCart size={20} />}
          accent="blue"
        />
        <KpiCard
          label="Avg Order Value"
          value={`$${avgOrderValue.toFixed(2)}`}
          icon={<TrendingUp size={20} />}
          accent="green"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly revenue bar chart */}
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Monthly Revenue (6 months)
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={monthlyRevenue}
              margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={gridStroke}
                vertical={false}
              />
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
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top 5 items */}
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Top Items by Revenue
          </h3>
          {topItems.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500">No item data</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                  <th className="text-left pb-2">Item</th>
                  <th className="text-right pb-2">Units</th>
                  <th className="text-right pb-2">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {topItems.map((item) => (
                  <tr key={item.name}>
                    <td className="py-2 pr-2 text-slate-700 dark:text-slate-300 text-xs truncate max-w-[160px]">
                      {item.name}
                    </td>
                    <td className="py-2 text-right text-slate-500 dark:text-slate-400 tabular-nums text-xs">
                      {item.units}
                    </td>
                    <td className="py-2 text-right font-semibold text-slate-800 dark:text-slate-200 tabular-nums text-xs">
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
