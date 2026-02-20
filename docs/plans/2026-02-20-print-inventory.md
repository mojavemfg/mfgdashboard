# Print Inventory Tab Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the Inventory Tab's hardcoded electronics data with an editable, localStorage-persisted system for tracking 3D printing supplies (filament spools, inserts, spare parts) with reorder status alerts.

**Architecture:** One unified `PrintItem` type covers all three categories with optional category-specific fields. A `usePrintInventory` hook manages localStorage CRUD and derives status from stock-vs-safety-stock thresholds. New components are drop-in replacements; existing dashboard and electronics inventory components are untouched.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Vite, Lucide React icons (no test framework — use `tsc --noEmit` for type verification)

---

## Key Context

- `src/components/inventory/StatusBadge.tsx` — takes `ReorderStatus = 'Critical' | 'Warning' | 'OK'`. We will create a parallel `PrintStatus` type that is structurally identical so it reuses `StatusBadge` without modifying it.
- `src/components/kpi/KpiCard.tsx` — reusable card, takes `{ label, value, icon, accent?, sub? }`. Use for KPI strip.
- Tailwind v4 — no config file. All utilities work inline.
- Path alias `@/` maps to `src/`.
- `localStorage` key: `mfg-print-inventory`.
- Seed data seeds only when the key is absent on first load.

---

### Task 1: Types

**Files:**
- Create: `src/types/printInventory.ts`

**Step 1: Write the types file**

```ts
// src/types/printInventory.ts

export type PrintCategory = 'Filament' | 'Insert' | 'Spare Part';
export type PrintStatus = 'Critical' | 'Warning' | 'OK';

export interface PrintItem {
  id: string;
  name: string;
  category: PrintCategory;
  unit: string;
  currentStock: number;
  safetyStock: number;
  reorderQty: number;
  leadTimeDays: number;
  supplier?: string;
  unitCost?: number;
  // Filament-specific
  material?: string;
  color?: string;
  // Insert-specific
  insertSize?: string;
  insertType?: string;
}

export interface PrintItemWithStatus extends PrintItem {
  status: PrintStatus;
  totalValue: number;
}
```

**Step 2: Verify TypeScript**

```bash
cd "mfg-ops-dashboard" && npx tsc --noEmit
```
Expected: no errors

**Step 3: Commit**

```bash
git add src/types/printInventory.ts
git commit -m "feat(print-inventory): add PrintItem types"
```

---

### Task 2: Seed Data

**Files:**
- Create: `src/data/printInventory.ts`

**Step 1: Write the seed data**

```ts
// src/data/printInventory.ts
import type { PrintItem } from '@/types/printInventory';

export const printInventorySeed: PrintItem[] = [
  {
    id: 'PI-001',
    name: 'Black PLA',
    category: 'Filament',
    unit: 'spools',
    currentStock: 3,
    safetyStock: 2,
    reorderQty: 5,
    leadTimeDays: 7,
    supplier: 'Hatchbox',
    unitCost: 22,
    material: 'PLA',
    color: 'Black',
  },
  {
    id: 'PI-002',
    name: 'White PLA',
    category: 'Filament',
    unit: 'spools',
    currentStock: 1,
    safetyStock: 2,
    reorderQty: 5,
    leadTimeDays: 7,
    supplier: 'Hatchbox',
    unitCost: 22,
    material: 'PLA',
    color: 'White',
  },
  {
    id: 'PI-003',
    name: 'Galaxy Blue PETG',
    category: 'Filament',
    unit: 'spools',
    currentStock: 2,
    safetyStock: 1,
    reorderQty: 3,
    leadTimeDays: 10,
    supplier: 'eSUN',
    unitCost: 26,
    material: 'PETG',
    color: 'Galaxy Blue',
  },
  {
    id: 'PI-004',
    name: 'M3 Heat-Set Insert',
    category: 'Insert',
    unit: 'pcs',
    currentStock: 120,
    safetyStock: 50,
    reorderQty: 200,
    leadTimeDays: 14,
    supplier: 'Amazon',
    unitCost: 0.08,
    insertSize: 'M3',
    insertType: 'Heat-Set',
  },
  {
    id: 'PI-005',
    name: 'M4 Heat-Set Insert',
    category: 'Insert',
    unit: 'pcs',
    currentStock: 40,
    safetyStock: 50,
    reorderQty: 200,
    leadTimeDays: 14,
    supplier: 'Amazon',
    unitCost: 0.10,
    insertSize: 'M4',
    insertType: 'Heat-Set',
  },
  {
    id: 'PI-006',
    name: '0.4mm Brass Nozzle',
    category: 'Spare Part',
    unit: 'pcs',
    currentStock: 8,
    safetyStock: 4,
    reorderQty: 10,
    leadTimeDays: 10,
    supplier: 'Amazon',
    unitCost: 1.50,
  },
  {
    id: 'PI-007',
    name: 'PEI Spring Steel Sheet',
    category: 'Spare Part',
    unit: 'pcs',
    currentStock: 2,
    safetyStock: 1,
    reorderQty: 3,
    leadTimeDays: 14,
    supplier: 'Bambu Lab',
    unitCost: 18,
  },
  {
    id: 'PI-008',
    name: 'PTFE Tube (1m)',
    category: 'Spare Part',
    unit: 'pcs',
    currentStock: 3,
    safetyStock: 2,
    reorderQty: 5,
    leadTimeDays: 7,
    supplier: 'Amazon',
    unitCost: 4,
  },
];
```

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no errors

**Step 3: Commit**

```bash
git add src/data/printInventory.ts
git commit -m "feat(print-inventory): add seed data"
```

---

### Task 3: usePrintInventory Hook

**Files:**
- Create: `src/hooks/usePrintInventory.ts`

**Step 1: Write the hook**

```ts
// src/hooks/usePrintInventory.ts
import { useState, useCallback, useMemo } from 'react';
import type { PrintItem, PrintItemWithStatus, PrintStatus } from '@/types/printInventory';
import { printInventorySeed } from '@/data/printInventory';

const STORAGE_KEY = 'mfg-print-inventory';

function deriveStatus(item: PrintItem): PrintStatus {
  if (item.currentStock <= item.safetyStock) return 'Critical';
  if (item.currentStock <= item.safetyStock * 1.5) return 'Warning';
  return 'OK';
}

function load(): PrintItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PrintItem[];
  } catch {
    // corrupted — fall through to seed
  }
  return printInventorySeed;
}

function save(items: PrintItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function generateId(): string {
  return `PI-${Date.now().toString(36).toUpperCase()}`;
}

export function usePrintInventory() {
  const [items, setItems] = useState<PrintItem[]>(load);

  const enriched = useMemo<PrintItemWithStatus[]>(() =>
    items.map((item) => ({
      ...item,
      status: deriveStatus(item),
      totalValue: item.currentStock * (item.unitCost ?? 0),
    })), [items]);

  const upsert = useCallback((item: PrintItem) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      const next = exists
        ? prev.map((i) => (i.id === item.id ? item : i))
        : [...prev, { ...item, id: generateId() }];
      save(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      save(next);
      return next;
    });
  }, []);

  const kpis = useMemo(() => {
    const critical = enriched.filter((i) => i.status === 'Critical').length;
    const warning = enriched.filter((i) => i.status === 'Warning').length;
    const totalValue = enriched.reduce((sum, i) => sum + i.totalValue, 0);
    return { total: enriched.length, critical, warning, totalValue };
  }, [enriched]);

  return { enriched, upsert, remove, kpis };
}
```

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no errors

**Step 3: Commit**

```bash
git add src/hooks/usePrintInventory.ts
git commit -m "feat(print-inventory): add usePrintInventory hook with localStorage CRUD"
```

---

### Task 4: PrintInventoryTable Component

**Files:**
- Create: `src/components/inventory/PrintInventoryTable.tsx`

**Step 1: Write the component**

```tsx
// src/components/inventory/PrintInventoryTable.tsx
import { useState } from 'react';
import { Pencil } from 'lucide-react';
import type { PrintItemWithStatus, PrintCategory } from '@/types/printInventory';
import { StatusBadge } from './StatusBadge';
import type { ReorderStatus } from '@/types';

type CategoryFilter = PrintCategory | 'All';

interface Props {
  items: PrintItemWithStatus[];
  onEdit: (item: PrintItemWithStatus) => void;
}

const CATEGORY_FILTERS: CategoryFilter[] = ['All', 'Filament', 'Insert', 'Spare Part'];

const inputCls = 'bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-slate-200 text-sm rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/60 transition-colors';

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
      {/* Category filter tabs */}
      <div className="flex items-center gap-1 mb-3 flex-wrap">
        {CATEGORY_FILTERS.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              categoryFilter === cat
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, material, color…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full px-3 py-2.5 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${inputCls}`}
        />
      </div>

      {/* Mobile card view */}
      <div className="sm:hidden flex flex-col gap-2">
        {filtered.map((item) => (
          <div key={item.id} className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2 mb-2.5">
              <div className="min-w-0">
                <p className="text-slate-900 dark:text-slate-200 text-sm font-semibold leading-tight truncate">{item.name}</p>
                <p className="text-slate-400 text-[10px] mt-0.5">
                  {item.category}
                  {item.material && ` · ${item.material}`}
                  {item.color && ` · ${item.color}`}
                  {item.insertSize && ` · ${item.insertSize}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={item.status as ReorderStatus} />
                <button onClick={() => onEdit(item)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <Pencil size={13} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Stock', value: `${item.currentStock} ${item.unit}` },
                { label: 'Safety', value: `${item.safetyStock} ${item.unit}` },
                { label: 'Lead Time', value: `${item.leadTimeDays}d` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2">
                  <p className="text-slate-400 text-[9px] uppercase tracking-wider">{label}</p>
                  <p className="text-xs font-semibold mt-0.5 text-slate-800 dark:text-slate-200">{value}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center py-8 text-slate-400 text-sm">No items match the filter.</p>}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700/60">
              <tr>
                {['Name', 'Category', 'Details', 'Stock', 'Safety Stock', 'Lead Time', 'Value', 'Status', ''].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 dark:border-slate-700/30 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                  <td className="px-3 py-3">
                    <div className="text-slate-800 dark:text-slate-200 text-xs font-medium">{item.name}</div>
                    {item.supplier && <div className="text-slate-400 text-[10px]">{item.supplier}</div>}
                  </td>
                  <td className="px-3 py-3 text-slate-500 dark:text-slate-400 text-xs">{item.category}</td>
                  <td className="px-3 py-3 text-slate-500 dark:text-slate-400 text-xs">
                    {item.category === 'Filament' && `${item.material ?? '—'} · ${item.color ?? '—'}`}
                    {item.category === 'Insert' && `${item.insertSize ?? '—'} · ${item.insertType ?? '—'}`}
                    {item.category === 'Spare Part' && '—'}
                  </td>
                  <td className="px-3 py-3 text-slate-700 dark:text-slate-300 font-mono text-xs">{item.currentStock} {item.unit}</td>
                  <td className="px-3 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">{item.safetyStock} {item.unit}</td>
                  <td className="px-3 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">{item.leadTimeDays}d</td>
                  <td className="px-3 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">
                    {item.totalValue > 0
                      ? `$${item.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : '—'}
                  </td>
                  <td className="px-3 py-3"><StatusBadge status={item.status as ReorderStatus} /></td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => onEdit(item)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-10 text-slate-400 text-sm">No items match the filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-slate-400 text-xs mt-2">Showing {filtered.length} of {items.length} items</p>
    </div>
  );
}
```

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no errors

**Step 3: Commit**

```bash
git add src/components/inventory/PrintInventoryTable.tsx
git commit -m "feat(print-inventory): add PrintInventoryTable with category filter and search"
```

---

### Task 5: PrintItemForm Component (Add/Edit Modal)

**Files:**
- Create: `src/components/inventory/PrintItemForm.tsx`

**Step 1: Write the form component**

```tsx
// src/components/inventory/PrintItemForm.tsx
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
```

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no errors

**Step 3: Commit**

```bash
git add src/components/inventory/PrintItemForm.tsx
git commit -m "feat(print-inventory): add PrintItemForm modal with category-conditional fields"
```

---

### Task 6: PrintInventoryView (Top-Level View with KPI Strip)

**Files:**
- Create: `src/components/inventory/PrintInventoryView.tsx`

**Step 1: Write the view**

```tsx
// src/components/inventory/PrintInventoryView.tsx
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
```

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no errors

**Step 3: Commit**

```bash
git add src/components/inventory/PrintInventoryView.tsx
git commit -m "feat(print-inventory): add PrintInventoryView with KPI strip and modal wiring"
```

---

### Task 7: Wire PrintInventoryView into Dashboard

**Files:**
- Modify: `src/pages/Dashboard.tsx`

**Step 1: Add the import at the top of Dashboard.tsx (after the existing InventoryTable import)**

```ts
import { PrintInventoryView } from '@/components/inventory/PrintInventoryView';
```

**Step 2: Replace the inventory view section**

Find this block in `src/pages/Dashboard.tsx` (line ~47-50):
```tsx
{activeView === 'inventory' && (
  <PageSection title="Inventory Management">
    <InventoryTable components={enrichedComponents} />
  </PageSection>
)}
```

Replace with:
```tsx
{activeView === 'inventory' && (
  <PageSection title="Print Inventory">
    <PrintInventoryView />
  </PageSection>
)}
```

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no errors

**Step 4: Start dev server and manually verify**

```bash
npm run dev
```

Open the app, click "Inventory" in the sidebar:
- KPI strip shows 4 cards (Total Items, Total Value, Critical, Warning)
- Seed data loads (Black PLA, M3 Insert, 0.4mm Nozzle, etc.)
- Category filter tabs work (All / Filament / Insert / Spare Part)
- Search filters by name, material, color
- Pencil icon opens Edit modal with pre-filled fields
- "+ Add Item" opens blank Add modal
- Filament fields (Material, Color) appear for Filament category
- Insert fields appear for Insert category
- Save updates the row; Delete removes it; data persists on page refresh

**Step 5: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat(print-inventory): wire PrintInventoryView into inventory tab"
```

---

## Done

All tasks complete. The Inventory Tab now shows 3D printing supplies (filament, inserts, spare parts) with editable localStorage-backed CRUD, category filtering, search, and Critical/Warning/OK status alerts. The existing dashboard Overview tab and electronics components data are untouched.
