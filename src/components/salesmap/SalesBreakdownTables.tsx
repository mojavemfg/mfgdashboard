import type { RegionStat } from '@/lib/salesMapData';

interface TableProps {
  title: string;
  rows: RegionStat[];
  labelHeader: string;
}

function BreakdownTable({ title, rows, labelHeader }: TableProps) {
  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
        <h3 className="text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-widest">
          {title}
        </h3>
      </div>
      <div className="overflow-y-auto max-h-72">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700/50">
              <th className="text-left px-4 py-2 text-slate-500 dark:text-slate-400 font-medium text-xs">
                {labelHeader}
              </th>
              <th className="text-right px-4 py-2 text-slate-500 dark:text-slate-400 font-medium text-xs">
                Orders
              </th>
              <th className="text-right px-4 py-2 text-slate-500 dark:text-slate-400 font-medium text-xs">
                Revenue
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.key}
                className="border-b border-slate-50 dark:border-slate-700/30 last:border-0"
              >
                <td className="px-4 py-2 text-slate-900 dark:text-slate-200 font-medium">
                  {row.label}
                </td>
                <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-400">
                  {row.count}
                </td>
                <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-400">
                  ${row.revenue.toFixed(2)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-6 text-center text-slate-400 dark:text-slate-500 text-sm"
                >
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface SalesBreakdownTablesProps {
  countryStats: RegionStat[];
  stateStats: RegionStat[];
}

export function SalesBreakdownTables({ countryStats, stateStats }: SalesBreakdownTablesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <BreakdownTable title="By Country" rows={countryStats} labelHeader="Country" />
      <BreakdownTable title="By US State" rows={stateStats} labelHeader="State" />
    </div>
  );
}
