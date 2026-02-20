# Margin Calculator Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Margin Calculator tab where users configure a 3D-printed Etsy listing (filament, electricity, packaging, hardware, Etsy fees) and see a live cost breakdown chart plus a two-way margin display (sale price ↔ target margin %).

**Architecture:** Single self-contained component `MarginCalculatorView.tsx` following the `EtsySeoTool.tsx` pattern. State persisted to `localStorage` (filament library + named product presets). Results panel uses a Recharts `PieChart` donut for cost breakdown and live two-way formula for sale price ↔ margin.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Recharts v3, lucide-react, localStorage.

**Design doc:** `docs/plans/2026-02-19-margin-calculator-design.md`

---

## Task 1: Wire navigation

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/BottomNav.tsx`

### Step 1: Add `'margin'` to the View union in `src/App.tsx`

Find line 9:
```ts
export type View = 'dashboard' | 'inventory' | 'orders' | 'charts' | 'seo' | 'salesmap';
```
Change to:
```ts
export type View = 'dashboard' | 'inventory' | 'orders' | 'charts' | 'seo' | 'salesmap' | 'margin';
```

### Step 2: Add nav item to `src/components/layout/Sidebar.tsx`

Add `Calculator` to the lucide import on line 1:
```ts
import { LayoutDashboard, PackageSearch, ShoppingCart, BarChart2, Tag, Map, Calculator } from 'lucide-react';
```

Add to `navItems` array after the `salesmap` entry:
```ts
{ id: 'margin', label: 'Margin Calc', Icon: Calculator },
```

In the `className` template string, the existing logic checks `isSeo` for orange. Add `isMargin` for emerald:
```tsx
const isSeo = id === 'seo';
const isMargin = id === 'margin';
```

Update the active className to:
```tsx
active
  ? isSeo
    ? 'bg-orange-500 text-white shadow-lg shadow-orange-900/20'
    : isMargin
      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
      : 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
```

Update the icon className:
```tsx
<Icon size={17} className={active ? (isSeo ? 'text-orange-100' : isMargin ? 'text-emerald-100' : 'text-blue-100') : ''} />
```

### Step 3: Add nav item to `src/components/layout/BottomNav.tsx`

Add `Calculator` to the lucide import:
```ts
import { LayoutDashboard, PackageSearch, ShoppingCart, BarChart2, Tag, Map, Calculator } from 'lucide-react';
```

Add to `navItems` after the `salesmap` entry:
```ts
{ id: 'margin', label: 'Margin', Icon: Calculator },
```

Add `isMargin` logic in the active className:
```tsx
const isSeo = id === 'seo';
const isMargin = id === 'margin';
// in className:
active
  ? isSeo ? 'text-orange-500 dark:text-orange-400'
  : isMargin ? 'text-emerald-600 dark:text-emerald-400'
  : 'text-blue-600 dark:text-blue-400'
  : 'text-slate-400 dark:text-slate-500'
```

### Step 4: Add view rendering to `src/pages/Dashboard.tsx`

Add import at top:
```ts
import { MarginCalculatorView } from '@/components/margin/MarginCalculatorView';
```

After the `salesmap` block (around line 87), add:
```tsx
{activeView === 'margin' && (
  <MarginCalculatorView />
)}
```

### Step 5: Create the stub component so the app compiles

Create `src/components/margin/MarginCalculatorView.tsx`:
```tsx
export function MarginCalculatorView() {
  return <div className="max-w-2xl mx-auto"><p className="text-slate-500 text-sm">Margin Calculator — coming soon</p></div>;
}
```

### Step 6: Run the dev server and verify navigation works

```bash
npm run dev
```

Click "Margin Calc" in the sidebar — you should see the stub text. TypeScript should compile clean.

### Step 7: Commit

```bash
git add src/App.tsx src/components/layout/Sidebar.tsx src/components/layout/BottomNav.tsx src/pages/Dashboard.tsx src/components/margin/MarginCalculatorView.tsx
git commit -m "feat(margin): wire Margin Calculator tab into navigation"
```

---

## Task 2: Types and localStorage utilities

**Files:**
- Create: `src/components/margin/MarginCalculatorView.tsx` (extend the stub)

All types and localStorage logic live inside the component file (same pattern as `EtsySeoTool.tsx` — no separate files for a self-contained tool).

### Step 1: Add types at the top of `MarginCalculatorView.tsx`

Replace the stub with:

```tsx
import { useState, useCallback } from 'react';
import { Calculator, Plus, X, ChevronDown, Pencil, Check, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FilamentPreset {
  id: string;
  name: string;
  costPerKg: number;
}

interface HardwareItem {
  id: string;
  name: string;
  cost: number;
}

interface ProductPreset {
  id: string;
  name: string;
  filamentId: string;
  filamentGrams: number;
  printHours: number;
  printerWatts: number;
  kwHRate: number;
  packagingCost: number;
  hardwareItems: HardwareItem[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LISTING_FEE = 0.20;
const TRANSACTION_RATE = 0.065;
const PROCESSING_RATE = 0.03;
const PROCESSING_FIXED = 0.25;

const DEFAULT_FILAMENTS: FilamentPreset[] = [
  { id: 'pla',   name: 'PLA',   costPerKg: 22 },
  { id: 'petg',  name: 'PETG',  costPerKg: 26 },
  { id: 'asa',   name: 'ASA',   costPerKg: 28 },
  { id: 'abs',   name: 'ABS',   costPerKg: 24 },
  { id: 'tpu',   name: 'TPU',   costPerKg: 35 },
  { id: 'resin', name: 'Resin', costPerKg: 40 },
];

const CHART_COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444'];

const LS_FILAMENTS = 'margin_filament_library';
const LS_PRESETS   = 'margin_presets';

// ─── localStorage helpers ─────────────────────────────────────────────────────

function loadFilaments(): FilamentPreset[] {
  try {
    const raw = localStorage.getItem(LS_FILAMENTS);
    if (raw) return JSON.parse(raw) as FilamentPreset[];
  } catch { /* ignore */ }
  return DEFAULT_FILAMENTS;
}

function saveFilaments(list: FilamentPreset[]) {
  localStorage.setItem(LS_FILAMENTS, JSON.stringify(list));
}

function loadPresets(): ProductPreset[] {
  try {
    const raw = localStorage.getItem(LS_PRESETS);
    if (raw) return JSON.parse(raw) as ProductPreset[];
  } catch { /* ignore */ }
  return [];
}

function savePresets(list: ProductPreset[]) {
  localStorage.setItem(LS_PRESETS, JSON.stringify(list));
}

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}
```

### Step 2: Add core calculation helpers below the constants

```tsx
// ─── Calculations ─────────────────────────────────────────────────────────────

function calcCosts(
  filaments: FilamentPreset[],
  state: {
    filamentId: string;
    filamentGrams: number;
    printHours: number;
    printerWatts: number;
    kwHRate: number;
    packagingCost: number;
    hardwareItems: HardwareItem[];
  }
) {
  const fil = filaments.find((f) => f.id === state.filamentId);
  const filamentCost = fil ? (state.filamentGrams / 1000) * fil.costPerKg : 0;
  const electricityCost = state.printHours * (state.printerWatts / 1000) * state.kwHRate;
  const hardwareCost = state.hardwareItems.reduce((s, h) => s + h.cost, 0);
  const baseCost = filamentCost + electricityCost + state.packagingCost + hardwareCost + LISTING_FEE;
  return { filamentCost, electricityCost, hardwareCost, baseCost };
}

function marginFromPrice(baseCost: number, salePrice: number) {
  if (salePrice <= 0) return 0;
  const fees = salePrice * TRANSACTION_RATE + salePrice * PROCESSING_RATE + PROCESSING_FIXED;
  const profit = salePrice - baseCost - fees;
  return profit / salePrice;
}

function priceFromMargin(baseCost: number, targetMargin: number) {
  // salePrice = (baseCost + PROCESSING_FIXED) / (1 - TRANSACTION_RATE - PROCESSING_RATE - targetMargin)
  const denom = 1 - TRANSACTION_RATE - PROCESSING_RATE - targetMargin;
  if (denom <= 0) return 0;
  return (baseCost + PROCESSING_FIXED) / denom;
}
```

### Step 3: No separate test files — verify calculations manually in browser console after Task 3 is complete.

### Step 4: Commit current progress

```bash
git add src/components/margin/MarginCalculatorView.tsx
git commit -m "feat(margin): add types, localStorage helpers, and calculation functions"
```

---

## Task 3: Main component state and preset bar

**Files:**
- Modify: `src/components/margin/MarginCalculatorView.tsx`

### Step 1: Add the main component with state

Below the calculation helpers, add:

```tsx
// ─── Main Component ───────────────────────────────────────────────────────────

const BLANK_STATE = {
  filamentId: 'pla',
  filamentGrams: 100,
  printHours: 4,
  printerWatts: 250,
  kwHRate: 0.13,
  packagingCost: 0.75,
  hardwareItems: [] as HardwareItem[],
};

export function MarginCalculatorView() {
  const [filaments, setFilaments] = useState<FilamentPreset[]>(loadFilaments);
  const [presets, setPresets] = useState<ProductPreset[]>(loadPresets);

  // Working state
  const [filamentId, setFilamentId] = useState(BLANK_STATE.filamentId);
  const [filamentGrams, setFilamentGrams] = useState(BLANK_STATE.filamentGrams);
  const [printHours, setPrintHours] = useState(BLANK_STATE.printHours);
  const [printerWatts, setPrinterWatts] = useState(BLANK_STATE.printerWatts);
  const [kwHRate, setKwHRate] = useState(BLANK_STATE.kwHRate);
  const [packagingCost, setPackagingCost] = useState(BLANK_STATE.packagingCost);
  const [hardwareItems, setHardwareItems] = useState<HardwareItem[]>([]);

  // Results state
  const [salePrice, setSalePrice] = useState<number>(0);
  const [targetMargin, setTargetMargin] = useState<number>(30);
  const [lastEdited, setLastEdited] = useState<'price' | 'margin'>('margin');

  // UI state
  const [showLibrary, setShowLibrary] = useState(false);
  const [saveNameDraft, setSaveNameDraft] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  const currentState = { filamentId, filamentGrams, printHours, printerWatts, kwHRate, packagingCost, hardwareItems };
  const { filamentCost, electricityCost, hardwareCost, baseCost } = calcCosts(filaments, currentState);

  // Two-way sync: when baseCost changes, recompute the non-user-edited field
  const displayMargin = marginFromPrice(baseCost, salePrice) * 100;
  const displayPrice = priceFromMargin(baseCost, targetMargin / 100);

  function handlePriceChange(val: number) {
    setSalePrice(val);
    setLastEdited('price');
    setTargetMargin(Math.round(marginFromPrice(baseCost, val) * 1000) / 10);
  }

  function handleMarginChange(val: number) {
    setTargetMargin(val);
    setLastEdited('margin');
    setSalePrice(Math.round(priceFromMargin(baseCost, val / 100) * 100) / 100);
  }

  function loadPreset(id: string) {
    const p = presets.find((x) => x.id === id);
    if (!p) return;
    setFilamentId(p.filamentId);
    setFilamentGrams(p.filamentGrams);
    setPrintHours(p.printHours);
    setPrinterWatts(p.printerWatts);
    setKwHRate(p.kwHRate);
    setPackagingCost(p.packagingCost);
    setHardwareItems(p.hardwareItems);
  }

  function savePreset() {
    const name = saveNameDraft.trim();
    if (!name) return;
    const newPreset: ProductPreset = { id: uid(), name, ...currentState };
    const updated = [...presets, newPreset];
    setPresets(updated);
    savePresets(updated);
    setSaveNameDraft('');
    setShowSaveInput(false);
  }

  function deletePreset(id: string) {
    const updated = presets.filter((p) => p.id !== id);
    setPresets(updated);
    savePresets(updated);
  }

  function resetState() {
    setFilamentId(BLANK_STATE.filamentId);
    setFilamentGrams(BLANK_STATE.filamentGrams);
    setPrintHours(BLANK_STATE.printHours);
    setPrinterWatts(BLANK_STATE.printerWatts);
    setKwHRate(BLANK_STATE.kwHRate);
    setPackagingCost(BLANK_STATE.packagingCost);
    setHardwareItems([]);
  }

  // Filament library edit helpers
  const updateFilament = useCallback((id: string, field: 'name' | 'costPerKg', value: string | number) => {
    setFilaments((prev) => {
      const updated = prev.map((f) => f.id === id ? { ...f, [field]: value } : f);
      saveFilaments(updated);
      return updated;
    });
  }, []);

  const addFilament = useCallback(() => {
    setFilaments((prev) => {
      const newF: FilamentPreset = { id: uid(), name: 'New', costPerKg: 25 };
      const updated = [...prev, newF];
      saveFilaments(updated);
      return updated;
    });
  }, []);

  const removeFilament = useCallback((id: string) => {
    setFilaments((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      saveFilaments(updated);
      return updated;
    });
  }, []);

  // ...JSX goes in Task 4
  return <div />;
}
```

### Step 2: Verify the app still compiles with `npm run dev`

### Step 3: Commit

```bash
git add src/components/margin/MarginCalculatorView.tsx
git commit -m "feat(margin): add main component state, preset helpers, two-way margin logic"
```

---

## Task 4: Input sections JSX

**Files:**
- Modify: `src/components/margin/MarginCalculatorView.tsx`

Replace the `return <div />;` stub with the full JSX. Build it in logical sub-sections.

### Step 1: Shared input style constant

Add above the `return`:
```tsx
const inputCls = 'w-full bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-slate-200 text-sm rounded-xl px-3.5 py-2.5 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500/60 transition-colors';
const numCls = `${inputCls} tabular-nums`;
const labelCls = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5';
const cardCls = 'bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none p-4 sm:p-5 mb-4';
const inlineCost = (val: number) => (
  <span className="ml-auto text-xs text-emerald-600 dark:text-emerald-400 font-mono font-semibold tabular-nums">
    ${val.toFixed(3)}
  </span>
);
```

### Step 2: Return the full JSX

```tsx
return (
  <div className="max-w-2xl mx-auto">
    {/* ── Header ── */}
    <div className="flex items-center gap-3 mb-6">
      <div className="bg-emerald-500/15 dark:bg-emerald-500/20 p-2.5 rounded-xl">
        <Calculator className="text-emerald-600 dark:text-emerald-400" size={22} />
      </div>
      <div>
        <h1 className="text-slate-900 dark:text-white text-xl font-bold leading-tight">Margin Calculator</h1>
        <p className="text-slate-500 text-sm mt-0.5">3D print cost breakdown · Etsy pricing · live margin</p>
      </div>
    </div>

    {/* ── Preset Bar ── */}
    <div className={cardCls}>
      <div className="flex items-center gap-2 flex-wrap">
        <select
          onChange={(e) => loadPreset(e.target.value)}
          defaultValue=""
          className="flex-1 min-w-0 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
        >
          <option value="" disabled>Load saved preset…</option>
          {presets.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {showSaveInput ? (
          <div className="flex gap-2 flex-1 min-w-0">
            <input
              autoFocus
              placeholder="Preset name…"
              value={saveNameDraft}
              onChange={(e) => setSaveNameDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && savePreset()}
              className="flex-1 min-w-0 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
            />
            <button onClick={savePreset} className="px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl border-none cursor-pointer hover:bg-emerald-700 transition-colors">
              <Check size={14} />
            </button>
            <button onClick={() => setShowSaveInput(false)} className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-xl border-none cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
              <X size={14} />
            </button>
          </div>
        ) : (
          <button onClick={() => setShowSaveInput(true)} className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-xl border-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap">
            Save as…
          </button>
        )}

        <button onClick={resetState} className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-xl border-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
          New
        </button>
      </div>

      {/* Saved presets list */}
      {presets.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {presets.map((p) => (
            <span key={p.id} className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 text-xs font-medium px-2.5 py-1 rounded-full">
              {p.name}
              <button onClick={() => deletePreset(p.id)} className="text-slate-400 hover:text-red-500 transition-colors border-none bg-transparent cursor-pointer p-0 leading-none">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>

    {/* ── Filament & Materials ── */}
    <div className={cardCls}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Filament & Materials</h2>
        <button onClick={() => setShowLibrary((v) => !v)} className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium border-none bg-transparent cursor-pointer hover:underline">
          <Pencil size={12} /> Edit Library
        </button>
      </div>

      {showLibrary && (
        <div className="mb-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700/50 p-3 space-y-2">
          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-2">Filament Library</p>
          {filaments.map((f) => (
            <div key={f.id} className="flex items-center gap-2">
              <input
                value={f.name}
                onChange={(e) => updateFilament(f.id, 'name', e.target.value)}
                className="flex-1 min-w-0 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-slate-400 text-xs shrink-0">$/kg</span>
              <input
                type="number" min={0} step={0.01}
                value={f.costPerKg}
                onChange={(e) => updateFilament(f.id, 'costPerKg', parseFloat(e.target.value) || 0)}
                className="w-20 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 tabular-nums"
              />
              <button onClick={() => removeFilament(f.id)} className="text-slate-400 hover:text-red-500 transition-colors border-none bg-transparent cursor-pointer p-1">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <button onClick={addFilament} className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium border-none bg-transparent cursor-pointer hover:underline">
            <Plus size={12} /> Add filament
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Filament Type</label>
          <select
            value={filamentId}
            onChange={(e) => setFilamentId(e.target.value)}
            className="w-full bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-slate-200 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {filaments.map((f) => (
              <option key={f.id} value={f.id}>{f.name} — ${f.costPerKg}/kg</option>
            ))}
          </select>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls.replace('mb-1.5', '')}>Filament (g)</label>
            {inlineCost(filamentCost)}
          </div>
          <input type="number" min={0} step={1} value={filamentGrams} onChange={(e) => setFilamentGrams(parseFloat(e.target.value) || 0)} className={numCls} placeholder="100" />
        </div>
      </div>
    </div>

    {/* ── Print Settings ── */}
    <div className={cardCls}>
      <h2 className="text-slate-700 dark:text-slate-300 font-semibold text-sm mb-4">Print Settings</h2>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Print Time (hr)</label>
          <input type="number" min={0} step={0.1} value={printHours} onChange={(e) => setPrintHours(parseFloat(e.target.value) || 0)} className={numCls} placeholder="4" />
        </div>
        <div>
          <label className={labelCls}>Printer (W)</label>
          <input type="number" min={0} step={10} value={printerWatts} onChange={(e) => setPrinterWatts(parseFloat(e.target.value) || 0)} className={numCls} placeholder="250" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls.replace('mb-1.5', '')}>Rate ($/kWh)</label>
            {inlineCost(electricityCost)}
          </div>
          <input type="number" min={0} step={0.01} value={kwHRate} onChange={(e) => setKwHRate(parseFloat(e.target.value) || 0)} className={numCls} placeholder="0.13" />
        </div>
      </div>
    </div>

    {/* ── Packaging ── */}
    <div className={cardCls}>
      <h2 className="text-slate-700 dark:text-slate-300 font-semibold text-sm mb-4">Packaging</h2>
      <div className="max-w-xs">
        <label className={labelCls}>Cost per unit ($)</label>
        <input type="number" min={0} step={0.01} value={packagingCost} onChange={(e) => setPackagingCost(parseFloat(e.target.value) || 0)} className={numCls} placeholder="0.75" />
      </div>
    </div>

    {/* ── Hardware Add-ons ── */}
    <div className={cardCls}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Hardware Add-ons</h2>
        <button
          onClick={() => setHardwareItems((prev) => [...prev, { id: uid(), name: '', cost: 0 }])}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-lg border border-emerald-200 dark:border-emerald-600/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors cursor-pointer"
        >
          <Plus size={12} /> Add item
        </button>
      </div>

      {hardwareItems.length === 0 && (
        <p className="text-slate-400 text-sm text-center py-3">No hardware items — click "Add item" to add screws, magnets, inserts, etc.</p>
      )}

      <div className="space-y-2">
        {hardwareItems.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <input
              placeholder="Item name (e.g. M3 screw)"
              value={item.name}
              onChange={(e) => setHardwareItems((prev) => prev.map((h) => h.id === item.id ? { ...h, name: e.target.value } : h))}
              className="flex-1 min-w-0 bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-slate-200 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500"
            />
            <span className="text-slate-400 text-xs shrink-0">$</span>
            <input
              type="number" min={0} step={0.01}
              placeholder="0.00"
              value={item.cost || ''}
              onChange={(e) => setHardwareItems((prev) => prev.map((h) => h.id === item.id ? { ...h, cost: parseFloat(e.target.value) || 0 } : h))}
              className="w-24 bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-slate-200 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 tabular-nums"
            />
            <button
              onClick={() => setHardwareItems((prev) => prev.filter((h) => h.id !== item.id))}
              className="text-slate-400 hover:text-red-500 transition-colors border-none bg-transparent cursor-pointer p-1 shrink-0"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>

      {hardwareItems.length > 0 && (
        <div className="flex justify-end mt-2">
          <span className="text-xs text-slate-400 font-mono tabular-nums">
            Total: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">${hardwareCost.toFixed(3)}</span>
          </span>
        </div>
      )}
    </div>

    {/* ── Etsy Fees Info ── */}
    <div className={cardCls}>
      <h2 className="text-slate-700 dark:text-slate-300 font-semibold text-sm mb-3">Etsy Fees</h2>
      <div className="space-y-2 text-sm">
        {[
          { label: 'Listing fee', value: `$${LISTING_FEE.toFixed(2)} (fixed per listing)` },
          { label: 'Transaction fee', value: `${(TRANSACTION_RATE * 100).toFixed(1)}% of sale price` },
          { label: 'Payment processing', value: `${(PROCESSING_RATE * 100).toFixed(0)}% of sale price + $${PROCESSING_FIXED.toFixed(2)}` },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-700/40 last:border-0">
            <span className="text-slate-500 dark:text-slate-400">{label}</span>
            <span className="text-slate-700 dark:text-slate-300 font-mono text-xs font-medium tabular-nums">{value}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-slate-400 mt-3">Transaction and processing fees are applied to the sale price — shown live in the results below.</p>
    </div>

    {/* ── Results Panel ── */}
    <ResultsPanel
      baseCost={baseCost}
      filamentCost={filamentCost}
      electricityCost={electricityCost}
      hardwareCost={hardwareCost}
      packagingCost={packagingCost}
      salePrice={salePrice}
      targetMargin={targetMargin}
      lastEdited={lastEdited}
      displayMargin={displayMargin}
      displayPrice={displayPrice}
      onPriceChange={handlePriceChange}
      onMarginChange={handleMarginChange}
    />
  </div>
);
```

### Step 3: Verify app compiles — `npm run dev`

### Step 4: Commit

```bash
git add src/components/margin/MarginCalculatorView.tsx
git commit -m "feat(margin): add all input section JSX (filament, print, packaging, hardware, fees)"
```

---

## Task 5: Results panel and donut chart

**Files:**
- Modify: `src/components/margin/MarginCalculatorView.tsx`

### Step 1: Add `ResultsPanel` component above `MarginCalculatorView`

```tsx
// ─── Results Panel ────────────────────────────────────────────────────────────

interface ResultsPanelProps {
  baseCost: number;
  filamentCost: number;
  electricityCost: number;
  hardwareCost: number;
  packagingCost: number;
  salePrice: number;
  targetMargin: number;
  lastEdited: 'price' | 'margin';
  displayMargin: number;
  displayPrice: number;
  onPriceChange: (v: number) => void;
  onMarginChange: (v: number) => void;
}

function ResultsPanel({
  baseCost, filamentCost, electricityCost, hardwareCost, packagingCost,
  salePrice, targetMargin, lastEdited, displayMargin, displayPrice,
  onPriceChange, onMarginChange,
}: ResultsPanelProps) {
  const activeSalePrice = lastEdited === 'price' ? salePrice : displayPrice;
  const activeMargin = lastEdited === 'margin' ? targetMargin : displayMargin;

  const etsyFees = activeSalePrice > 0
    ? activeSalePrice * TRANSACTION_RATE + activeSalePrice * PROCESSING_RATE + PROCESSING_FIXED
    : 0;
  const profit = activeSalePrice > 0 ? activeSalePrice - baseCost - etsyFees : 0;

  const marginPct = activeMargin;
  const badgeColor =
    marginPct < 15 ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-600/40'
    : marginPct < 30 ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-400 dark:border-yellow-600/40'
    : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-600/40';

  const chartData = [
    { name: 'Filament',     value: filamentCost },
    { name: 'Electricity',  value: electricityCost },
    { name: 'Packaging',    value: packagingCost },
    { name: 'Hardware',     value: hardwareCost },
    { name: 'Etsy Fees',    value: Math.max(0, LISTING_FEE + etsyFees) },
  ].filter((d) => d.value > 0);

  const numCls = 'bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-slate-200 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors tabular-nums w-full';

  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none p-4 sm:p-5 mb-8">
      <h2 className="text-slate-700 dark:text-slate-300 font-semibold text-sm mb-4">Results</h2>

      {/* Total cost */}
      <div className="flex items-center justify-between mb-4 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl">
        <span className="text-slate-500 dark:text-slate-400 text-sm">Total Cost</span>
        <span className="text-slate-900 dark:text-white font-bold text-lg tabular-nums font-mono">${baseCost.toFixed(2)}</span>
      </div>

      {/* Donut chart */}
      {chartData.length > 0 && (
        <div className="mb-4">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((_, idx) => (
                  <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: number) => [`$${val.toFixed(3)}`, '']}
                contentStyle={{
                  backgroundColor: 'var(--tooltip-bg, #fff)',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: 12,
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value: string, entry: { payload?: { value?: number } }) =>
                  `${value} $${(entry.payload?.value ?? 0).toFixed(3)}`
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Two-way margin inputs */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Sale Price ($)
          </label>
          <input
            type="number" min={0} step={0.01}
            value={lastEdited === 'price' ? salePrice || '' : displayPrice > 0 ? Math.round(displayPrice * 100) / 100 : ''}
            onChange={(e) => onPriceChange(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className={numCls}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Target Margin (%)
          </label>
          <input
            type="number" min={0} max={99} step={0.5}
            value={lastEdited === 'margin' ? targetMargin : Math.round(displayMargin * 10) / 10}
            onChange={(e) => onMarginChange(parseFloat(e.target.value) || 0)}
            placeholder="30"
            className={numCls}
          />
        </div>
      </div>

      {/* Profit summary */}
      {activeSalePrice > 0 && (
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs mb-0.5">Profit per sale</p>
            <p className={`font-bold text-lg tabular-nums font-mono ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              {profit >= 0 ? '+' : ''}{profit.toFixed(2)}
            </p>
          </div>
          <span className={`text-sm font-bold px-3 py-1.5 rounded-full border ${badgeColor}`}>
            {Math.round(marginPct * 10) / 10}% margin
          </span>
        </div>
      )}

      {activeSalePrice === 0 && (
        <p className="text-center text-slate-400 text-sm py-2">Enter a sale price or target margin to see your profit.</p>
      )}
    </div>
  );
}
```

### Step 2: Verify app compiles and renders — `npm run dev`

- Navigate to Margin Calc tab
- Fill in filament grams, print time, add a hardware item
- Type a sale price — margin % should update
- Type a margin % — sale price should update
- Donut chart should appear with colored slices

### Step 3: Commit

```bash
git add src/components/margin/MarginCalculatorView.tsx
git commit -m "feat(margin): add ResultsPanel with donut chart and two-way margin display"
```

---

## Task 6: Smoke-test the full feature

### Step 1: Run dev and manually verify all paths

```bash
npm run dev
```

Checklist:
- [ ] Sidebar shows "Margin Calc" with Calculator icon, active state is emerald green
- [ ] BottomNav shows "Margin" tab (mobile breakpoint)
- [ ] Filament library opens/closes, filaments can be edited, added, deleted (persists on refresh)
- [ ] Preset can be saved (type name + Save as…), loaded from dropdown, deleted
- [ ] "New" button resets all fields
- [ ] Typing grams updates inline cost label
- [ ] Typing watts + hours + rate updates electricity inline cost
- [ ] Adding hardware items shows rows, removal works, total shown
- [ ] Donut chart renders when any cost > 0
- [ ] Sale price input → margin % updates
- [ ] Target margin input → sale price updates
- [ ] Margin badge is red < 15%, yellow 15–30%, green > 30%
- [ ] Dark mode toggle — all sections look correct

### Step 2: Run TypeScript check

```bash
npm run build
```

Expected: no TypeScript errors.

### Step 3: Final commit

```bash
git add -A
git commit -m "feat(margin): complete Margin Calculator tab — filament library, presets, cost breakdown, donut chart, two-way margin"
```
