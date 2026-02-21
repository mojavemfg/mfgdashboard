import { useState } from 'react';
import { Pencil } from 'lucide-react';
import type { PrintItemWithStatus, PrintCategory } from '@/types/printInventory';
import { StatusBadge } from './StatusBadge';
import { Input } from '@/components/ui/Input';
import type { ReorderStatus } from '@/types';

type CategoryFilter = PrintCategory | 'All';

interface Props {
  items: PrintItemWithStatus[];
  onEdit: (item: PrintItemWithStatus) => void;
}

const CATEGORY_FILTERS: CategoryFilter[] = ['All', 'Filament', 'Insert', 'Spare Part'];

export function PrintInventoryTable({ items, onEdit }: Props) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All');

  const filtered = items.filter((item) => {
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.material ?? '').toLowerCase().includes(q) ||
      (item.color ?? '').toLowerCase().includes(q) ||
      (item.insertSize ?? '').toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {CATEGORY_FILTERS.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={[
              'h-7 px-3 text-xs font-medium rounded-[var(--radius-md)] transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]',
              categoryFilter === cat
                ? 'bg-[var(--color-brand)] text-white'
                : 'bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
            ].join(' ')}
          >
            {cat}
          </button>
        ))}
        <div className="flex-1 min-w-[200px]">
          <Input
            type="text"
            placeholder="Search by name, material, color…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Mobile card view */}
      <div className="sm:hidden flex flex-col gap-2">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-3"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)] leading-tight truncate">{item.name}</p>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                  {item.category}
                  {item.material && ` · ${item.material}`}
                  {item.color && ` · ${item.color}`}
                  {item.insertSize && ` · ${item.insertSize}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={item.status as ReorderStatus} />
                <button
                  onClick={() => onEdit(item)}
                  className="p-1 rounded-[var(--radius-md)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  <Pencil size={13} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Stock',     value: `${item.currentStock} ${item.unit}` },
                { label: 'Safety',    value: `${item.safetyStock} ${item.unit}` },
                { label: 'Lead',      value: `${item.leadTimeDays}d` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[var(--color-bg-subtle)] rounded-[var(--radius-md)] p-2">
                  <p className="text-[9px] uppercase tracking-wide text-[var(--color-text-tertiary)]">{label}</p>
                  <p className="text-xs font-medium mt-0.5 text-[var(--color-text-primary)]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center py-8 text-sm text-[var(--color-text-tertiary)]">No items match the filter.</p>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--color-bg-subtle)]">
              <tr>
                {['Name', 'Category', 'Details', 'Stock', 'Safety', 'Lead', 'Value', 'Status', ''].map((h, i) => (
                  <th
                    key={i}
                    className="h-9 px-4 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide border-b border-[var(--color-border)] whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-[var(--color-bg)]">
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  className="group border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-subtle)] transition-colors duration-100"
                >
                  <td className="h-11 px-4">
                    <div className="text-sm font-medium text-[var(--color-text-primary)]">{item.name}</div>
                    {item.supplier && <div className="text-xs text-[var(--color-text-tertiary)]">{item.supplier}</div>}
                  </td>
                  <td className="h-11 px-4 text-sm text-[var(--color-text-secondary)]">{item.category}</td>
                  <td className="h-11 px-4 text-sm text-[var(--color-text-secondary)]">
                    {item.category === 'Filament' && `${item.material ?? '—'} · ${item.color ?? '—'}`}
                    {item.category === 'Insert'   && `${item.insertSize ?? '—'} · ${item.insertType ?? '—'}`}
                    {item.category === 'Spare Part' && '—'}
                  </td>
                  <td className="h-11 px-4 text-sm font-mono text-[var(--color-text-primary)]">{item.currentStock} {item.unit}</td>
                  <td className="h-11 px-4 text-sm font-mono text-[var(--color-text-secondary)]">{item.safetyStock} {item.unit}</td>
                  <td className="h-11 px-4 text-sm font-mono text-[var(--color-text-secondary)]">{item.leadTimeDays}d</td>
                  <td className="h-11 px-4 text-sm font-mono text-[var(--color-text-secondary)]">
                    {item.unitCost !== undefined
                      ? `$${item.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : '—'}
                  </td>
                  <td className="h-11 px-4">
                    <StatusBadge status={item.status as ReorderStatus} />
                  </td>
                  <td className="h-11 px-4">
                    <button
                      onClick={() => onEdit(item)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-[var(--radius-md)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)] transition-all duration-150"
                    >
                      <Pencil size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-sm text-[var(--color-text-tertiary)]">
                    No items match the filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-[var(--color-text-tertiary)] mt-2">
        Showing {filtered.length} of {items.length} items
      </p>
    </div>
  );
}
