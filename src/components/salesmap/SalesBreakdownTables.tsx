import type { RegionStat } from '@/lib/salesMapData';

interface TableProps {
  title: string;
  rows: RegionStat[];
  labelHeader: string;
}

function BreakdownTable({ title, rows, labelHeader }: TableProps) {
  return (
    <div className="bg-[var(--color-bg)] rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <h3 className="text-[var(--color-text-tertiary)] font-semibold text-xs uppercase tracking-widest">
          {title}
        </h3>
      </div>
      <div className="overflow-y-auto max-h-72">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="text-left px-4 py-2 text-[var(--color-text-tertiary)] font-medium text-xs">
                {labelHeader}
              </th>
              <th className="text-right px-4 py-2 text-[var(--color-text-tertiary)] font-medium text-xs">
                Orders
              </th>
              <th className="text-right px-4 py-2 text-[var(--color-text-tertiary)] font-medium text-xs">
                Revenue
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.key}
                className="border-b border-[var(--color-border)] last:border-0"
              >
                <td className="px-4 py-2 text-[var(--color-text-primary)] font-medium">
                  {row.label}
                </td>
                <td className="px-4 py-2 text-right text-[var(--color-text-secondary)]">
                  {row.count}
                </td>
                <td className="px-4 py-2 text-right text-[var(--color-text-secondary)]">
                  ${row.revenue.toFixed(2)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-6 text-center text-[var(--color-text-tertiary)] text-sm"
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
