import { useState } from 'react';
import { Plus, Package, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { usePrintInventory } from '@/hooks/usePrintInventory';
import { PrintInventoryTable } from './PrintInventoryTable';
import { PrintItemForm } from './PrintItemForm';
import { KpiCard } from '@/components/kpi/KpiCard';
import type { PrintItemWithStatus } from '@/types/printInventory';

export function PrintInventoryView() {
  const { enriched, upsert, remove, kpis } = usePrintInventory();
  const [editTarget, setEditTarget] = useState<PrintItemWithStatus | null | 'new'>(null);

  const modalItem = editTarget === 'new' ? null : editTarget;
  const modalOpen = editTarget !== null;

  return (
    <div>
      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label="Total Items"
          value={kpis.total}
          icon={<Package size={18} />}
          accent="blue"
        />
        <KpiCard
          label="Total Value"
          value={`$${kpis.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<DollarSign size={18} />}
          accent="green"
        />
        <KpiCard
          label="Critical"
          value={kpis.critical}
          icon={<AlertTriangle size={18} />}
          accent="red"
          sub="below safety stock"
        />
        <KpiCard
          label="Warning"
          value={kpis.warning}
          icon={<CheckCircle size={18} />}
          accent="yellow"
          sub="approaching safety stock"
        />
      </div>

      {/* Add button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setEditTarget('new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
        >
          <Plus size={15} />
          Add Item
        </button>
      </div>

      <PrintInventoryTable
        items={enriched}
        onEdit={(item) => setEditTarget(item)}
      />

      {modalOpen && (
        <PrintItemForm
          initial={modalItem}
          onSave={upsert}
          onDelete={remove}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}
