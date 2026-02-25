import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PrintInventoryTable } from './PrintInventoryTable';
import { PrintItemForm } from './PrintItemForm';
import { KpiCard } from '@/components/kpi/KpiCard';
import { Button } from '@/components/ui/Button';
import type { PrintItemWithStatus, PrintItem } from '@/types/printInventory';

interface PrintInventoryViewProps {
  enriched: PrintItemWithStatus[];
  upsert: (item: PrintItem) => void;
  remove: (id: string) => void;
  kpis: { total: number; critical: number; warning: number; totalValue: number };
}

export function PrintInventoryView({ enriched, upsert, remove, kpis }: PrintInventoryViewProps) {
  const [editTarget, setEditTarget] = useState<PrintItemWithStatus | null | 'new'>(null);

  const modalItem = editTarget === 'new' ? null : editTarget;
  const modalOpen = editTarget !== null;

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">Print Inventory</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            Track filament, inserts, and spare parts
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          iconLeft={<Plus size={14} />}
          onClick={() => setEditTarget('new')}
        >
          Add Item
        </Button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Total Items"  value={kpis.total} />
        <KpiCard
          label="Total Value"
          value={`$${kpis.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
        <KpiCard label="Critical"     value={kpis.critical}  sub="below safety stock" />
        <KpiCard label="Warning"      value={kpis.warning}   sub="approaching safety stock" />
      </div>

      <PrintInventoryTable items={enriched} onEdit={(item) => setEditTarget(item)} />

      {modalOpen && (
        <PrintItemForm
          key={modalItem?.id ?? 'new'}
          initial={modalItem}
          onSave={upsert}
          onDelete={remove}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}
