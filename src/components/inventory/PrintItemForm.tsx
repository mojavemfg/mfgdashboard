import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import type { PrintItem, PrintCategory } from '@/types/printInventory';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Input';

interface Props {
  initial?: PrintItem | null;
  onSave: (item: PrintItem) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

const CATEGORIES: PrintCategory[] = ['Filament', 'Insert', 'Spare Part'];
const MATERIALS   = ['PLA', 'PETG', 'ABS', 'TPU', 'ASA', 'Other'];
const INSERT_SIZES = ['M2', 'M3', 'M4', 'M5', 'Other'];
const INSERT_TYPES = ['Heat-Set', 'Knurled', 'Threaded', 'Other'];

const blankForm = (): Omit<PrintItem, 'id'> => ({
  name: '',
  category: 'Filament',
  unit: 'spools',
  currentStock: 0,
  safetyStock: 0,
  reorderQty: 0,
  leadTimeDays: 7,
  supplier: '',
  unitCost: undefined,
  material: 'PLA',
  color: '',
  insertSize: 'M3',
  insertType: 'Heat-Set',
});

export function PrintItemForm({ initial, onSave, onDelete, onClose }: Props) {
  const [form, setForm] = useState<Omit<PrintItem, 'id'>>(
    initial ? { ...blankForm(), ...initial } : blankForm()
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setForm(initial ? { ...blankForm(), ...initial } : blankForm());
    setConfirmDelete(false);
  }, [initial]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleCategoryChange(cat: PrintCategory) {
    const unitDefaults: Record<PrintCategory, string> = {
      Filament: 'spools',
      Insert: 'pcs',
      'Spare Part': 'pcs',
    };
    setForm((prev) => ({
      ...prev,
      category: cat,
      unit: unitDefaults[cat],
      material:    cat === 'Filament' ? (prev.material ?? 'PLA') : undefined,
      color:       cat === 'Filament' ? prev.color : undefined,
      insertSize:  cat === 'Insert'   ? (prev.insertSize ?? 'M3') : undefined,
      insertType:  cat === 'Insert'   ? (prev.insertType ?? 'Heat-Set') : undefined,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const item: PrintItem = {
      id: initial?.id || crypto.randomUUID(),
      ...form,
      supplier: form.supplier || undefined,
      unitCost: form.unitCost !== undefined && form.unitCost > 0 ? form.unitCost : undefined,
    };
    onSave(item);
    onClose();
  }

  const isEdit = !!initial;

  const footer = (
    <div className="flex items-center justify-between w-full">
      {/* Left: delete */}
      <div>
        {isEdit && onDelete && (
          confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--color-danger)]">Delete this item?</span>
              <Button
                variant="danger"
                size="sm"
                onClick={() => { onDelete(initial!.id); onClose(); }}
              >
                Confirm
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              iconLeft={<Trash2 size={13} />}
              onClick={() => setConfirmDelete(true)}
              className="text-[var(--color-danger)] hover:text-[var(--color-danger)]"
            >
              Delete
            </Button>
          )
        )}
      </div>
      {/* Right: cancel / save */}
      <div className="flex gap-2">
        <Button variant="secondary" size="md" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="md" type="submit" form="print-item-form">
          {isEdit ? 'Save Changes' : 'Add Item'}
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Edit Item' : 'Add Item'}
      footer={footer}
    >
      <form id="print-item-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Name *">
          <Input
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Black PLA, M3 Insert, 0.4mm Nozzle"
          />
        </Field>

        <Field label="Category *">
          <Select
            value={form.category}
            onChange={(e) => handleCategoryChange(e.target.value as PrintCategory)}
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>

        {form.category === 'Filament' && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Material">
              <Select value={form.material ?? 'PLA'} onChange={(e) => set('material', e.target.value)}>
                {MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
              </Select>
            </Field>
            <Field label="Color">
              <Input
                value={form.color ?? ''}
                onChange={(e) => set('color', e.target.value)}
                placeholder="e.g. Galaxy Blue"
              />
            </Field>
          </div>
        )}

        {form.category === 'Insert' && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Insert Size">
              <Select value={form.insertSize ?? 'M3'} onChange={(e) => set('insertSize', e.target.value)}>
                {INSERT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="Insert Type">
              <Select value={form.insertType ?? 'Heat-Set'} onChange={(e) => set('insertType', e.target.value)}>
                {INSERT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Current Stock *">
            <Input
              required
              type="number"
              min={0}
              value={form.currentStock}
              onChange={(e) => set('currentStock', Number(e.target.value))}
            />
          </Field>
          <Field label="Unit *">
            <Input
              required
              value={form.unit}
              onChange={(e) => set('unit', e.target.value)}
              placeholder="spools, pcs…"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Safety Stock *">
            <Input
              required
              type="number"
              min={0}
              value={form.safetyStock}
              onChange={(e) => set('safetyStock', Number(e.target.value))}
            />
          </Field>
          <Field label="Reorder Qty *">
            <Input
              required
              type="number"
              min={0}
              value={form.reorderQty}
              onChange={(e) => set('reorderQty', Number(e.target.value))}
            />
          </Field>
        </div>

        <Field label="Lead Time (days) *">
          <Input
            required
            type="number"
            min={1}
            value={form.leadTimeDays}
            onChange={(e) => set('leadTimeDays', Number(e.target.value))}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Supplier">
            <Input
              value={form.supplier ?? ''}
              onChange={(e) => set('supplier', e.target.value)}
              placeholder="Amazon, Hatchbox…"
            />
          </Field>
          <Field label="Unit Cost ($)">
            <Input
              type="number"
              min={0}
              step={0.01}
              value={form.unitCost ?? ''}
              onChange={(e) => set('unitCost', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="0.00"
            />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
