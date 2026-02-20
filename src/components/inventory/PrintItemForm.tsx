import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { PrintItem, PrintCategory } from '@/types/printInventory';

interface Props {
  initial?: PrintItem | null;
  onSave: (item: PrintItem) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

const CATEGORIES: PrintCategory[] = ['Filament', 'Insert', 'Spare Part'];
const MATERIALS = ['PLA', 'PETG', 'ABS', 'TPU', 'ASA', 'Other'];
const INSERT_SIZES = ['M2', 'M3', 'M4', 'M5', 'Other'];
const INSERT_TYPES = ['Heat-Set', 'Knurled', 'Threaded', 'Other'];

const inputCls = 'w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-200 text-sm rounded-lg focus:outline-none focus:border-blue-500 transition-colors';
const labelCls = 'block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1';

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
    set('category', cat);
    set('unit', unitDefaults[cat]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const item: PrintItem = {
      id: initial?.id ?? '',
      ...form,
      supplier: form.supplier || undefined,
      unitCost: form.unitCost !== undefined && form.unitCost > 0 ? form.unitCost : undefined,
    };
    onSave(item);
    onClose();
  }

  const isEdit = !!initial;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700/60">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{isEdit ? 'Edit Item' : 'Add Item'}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[70vh] px-5 py-4 flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className={labelCls}>Name *</label>
            <input required value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} placeholder="e.g. Black PLA, M3 Insert, 0.4mm Nozzle" />
          </div>

          {/* Category */}
          <div>
            <label className={labelCls}>Category *</label>
            <select value={form.category} onChange={(e) => handleCategoryChange(e.target.value as PrintCategory)} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Category-specific fields */}
          {form.category === 'Filament' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Material</label>
                <select value={form.material ?? 'PLA'} onChange={(e) => set('material', e.target.value)} className={inputCls}>
                  {MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Color</label>
                <input value={form.color ?? ''} onChange={(e) => set('color', e.target.value)} className={inputCls} placeholder="e.g. Galaxy Blue" />
              </div>
            </div>
          )}

          {form.category === 'Insert' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Insert Size</label>
                <select value={form.insertSize ?? 'M3'} onChange={(e) => set('insertSize', e.target.value)} className={inputCls}>
                  {INSERT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Insert Type</label>
                <select value={form.insertType ?? 'Heat-Set'} onChange={(e) => set('insertType', e.target.value)} className={inputCls}>
                  {INSERT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Stock fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Current Stock *</label>
              <input required type="number" min={0} value={form.currentStock} onChange={(e) => set('currentStock', Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Unit *</label>
              <input required value={form.unit} onChange={(e) => set('unit', e.target.value)} className={inputCls} placeholder="spools, pcs…" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Safety Stock *</label>
              <input required type="number" min={0} value={form.safetyStock} onChange={(e) => set('safetyStock', Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Reorder Qty *</label>
              <input required type="number" min={0} value={form.reorderQty} onChange={(e) => set('reorderQty', Number(e.target.value))} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Lead Time (days) *</label>
            <input required type="number" min={1} value={form.leadTimeDays} onChange={(e) => set('leadTimeDays', Number(e.target.value))} className={inputCls} />
          </div>

          {/* Optional */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Supplier</label>
              <input value={form.supplier ?? ''} onChange={(e) => set('supplier', e.target.value)} className={inputCls} placeholder="Amazon, Hatchbox…" />
            </div>
            <div>
              <label className={labelCls}>Unit Cost ($)</label>
              <input type="number" min={0} step={0.01} value={form.unitCost ?? ''} onChange={(e) => set('unitCost', e.target.value ? Number(e.target.value) : undefined)} className={inputCls} placeholder="0.00" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 mt-1">
            {isEdit && onDelete ? (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600 dark:text-red-400">Delete this item?</span>
                  <button type="button" onClick={() => { onDelete(initial!.id); onClose(); }}
                    className="text-xs px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium">
                    Confirm
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(false)}
                    className="text-xs px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-colors">
                    Cancel
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors">
                  <Trash2 size={13} /> Delete
                </button>
              )
            ) : <span />}

            <div className="flex gap-2">
              <button type="button" onClick={onClose}
                className="px-4 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium">
                Cancel
              </button>
              <button type="submit"
                className="px-4 py-2 text-sm rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors font-medium">
                {isEdit ? 'Save' : 'Add Item'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
