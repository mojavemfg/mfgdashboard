import type { ReactNode } from 'react';
import { Table, Thead, Th, Tbody, TableEmpty } from '@/components/ui/Table';

export interface ResponsiveColumn<T> {
  key: string;
  label: string;
  sortDir?: 'asc' | 'desc' | null;
  onSort?: () => void;
  align?: 'left' | 'center' | 'right';
  width?: string;
  render: (row: T) => ReactNode;
}

interface ResponsiveTableProps<T> {
  columns: ResponsiveColumn<T>[];
  data: T[];
  /**
   * Custom card renderer for mobile viewports (< 768px).
   * Tablets (768px+) see the standard table.
   */
  renderMobileCard: (row: T, index: number) => ReactNode;
  onRowClick?: (row: T) => void;
  emptyState?: ReactNode;
  getRowKey: (row: T, index: number) => string | number;
}

/**
 * Renders a data table on tablet/desktop (md+) and a card list on mobile (< md).
 * The caller provides `renderMobileCard` to define the card layout — keeping
 * domain-specific presentation logic in the page, not in this generic component.
 */
export function ResponsiveTable<T>({
  columns,
  data,
  renderMobileCard,
  onRowClick,
  emptyState,
  getRowKey,
}: ResponsiveTableProps<T>) {
  return (
    <>
      {/* Tablet + desktop table — md and above */}
      <div className="hidden md:block">
        <Table>
          <Thead>
            <tr>
              {columns.map((col) => (
                <Th
                  key={col.key}
                  sortDir={col.sortDir}
                  onSort={col.onSort}
                  align={col.align}
                  width={col.width}
                >
                  {col.label}
                </Th>
              ))}
            </tr>
          </Thead>
          <Tbody>
            {data.length === 0
              ? (emptyState ?? (
                <TableEmpty title="No items" description="Nothing to show here yet." />
              ))
              : data.map((row, i) => (
                  <tr
                    key={getRowKey(row, i)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={[
                      'border-b border-[var(--color-border)] last:border-0 transition-colors duration-100',
                      'hover:bg-[var(--color-bg-subtle)]',
                      onRowClick ? 'cursor-pointer' : '',
                    ].join(' ')}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={[
                          'h-11 px-4 text-sm text-[var(--color-text-primary)]',
                          col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                        ].join(' ')}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
          </Tbody>
        </Table>
      </div>

      {/* Mobile card list — below md */}
      <div className="md:hidden">
        {data.length === 0
          ? (
            <div className="py-12 text-center text-sm text-[var(--color-text-tertiary)]">
              {emptyState ?? 'No items'}
            </div>
          )
          : data.map((row, i) => (
              <div
                key={getRowKey(row, i)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? 'cursor-pointer active:opacity-75' : ''}
              >
                {renderMobileCard(row, i)}
              </div>
            ))}
      </div>
    </>
  );
}
