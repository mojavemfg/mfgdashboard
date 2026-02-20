# Print Inventory Tab — Design

**Date:** 2026-02-20
**Status:** Approved

## Overview

Rework the Inventory Tab to track 3D printing supplies — filament, heat-set inserts, and spare parts — replacing the current hardcoded electronics component dataset with an editable, localStorage-persisted system.

---

## Goals

- Users can add, edit, and delete inventory items in the UI
- Data persists across sessions via localStorage
- Three item categories: Filament, Insert, Spare Part
- Unified table with category filter strip (All / Filament / Inserts / Spare Parts)
- Reorder status (Critical / Warning / OK) based on stock vs. safety stock thresholds
- KPI strip showing total items, total value, critical count, warning count

---

## Data Model

```ts
// src/types/printInventory.ts

type PrintCategory = 'Filament' | 'Insert' | 'Spare Part';

interface PrintItem {
  id: string;           // UUID, auto-generated on create
  name: string;         // e.g. "Black PLA", "M3 Heat-Set Insert", "0.4mm Nozzle"
  category: PrintCategory;
  unit: string;         // "spools", "pcs", "rolls", etc.
  currentStock: number; // whole units

  // Reorder fields
  safetyStock: number;
  reorderQty: number;
  leadTimeDays: number;

  // Optional
  supplier?: string;
  unitCost?: number;

  // Filament-specific (shown when category === 'Filament')
  material?: string;    // e.g. "PLA", "PETG", "ABS", "TPU", "ASA"
  color?: string;       // free text, e.g. "Matte Black", "Galaxy Blue"

  // Insert-specific (shown when category === 'Insert')
  insertSize?: string;  // e.g. "M2", "M3", "M4", "M5"
  insertType?: string;  // e.g. "Heat-Set", "Knurled", "Threaded"
}

interface PrintItemWithStatus extends PrintItem {
  status: 'Critical' | 'Warning' | 'OK';
  totalValue: number; // currentStock × unitCost (0 if no cost set)
}
```

---

## Reorder Status Logic

No daily consumption history — threshold-based:

```
Critical  → currentStock ≤ safetyStock
Warning   → currentStock ≤ safetyStock × 1.5
OK        → currentStock > safetyStock × 1.5
```

---

## Components

| File | Purpose |
|---|---|
| `src/types/printInventory.ts` | `PrintItem`, `PrintCategory`, `PrintItemWithStatus` types |
| `src/data/printInventory.ts` | Seed data (~10 items: filament spools, inserts, nozzles) |
| `src/hooks/usePrintInventory.ts` | localStorage CRUD, status derivation, KPI metrics |
| `src/components/inventory/PrintInventoryView.tsx` | Top-level view: KPI strip + table |
| `src/components/inventory/PrintInventoryTable.tsx` | Table with sort, category filter tabs, search |
| `src/components/inventory/PrintItemForm.tsx` | Add/Edit modal with category-conditional fields |

### Existing files updated

- `src/pages/Dashboard.tsx` — swap `InventoryTable` for `PrintInventoryView` in `activeView === 'inventory'`

### Existing files left untouched

- `src/components/inventory/InventoryTable.tsx` (still used in dashboard Overview)
- `src/components/inventory/StatusBadge.tsx` (reused as-is)
- `src/hooks/useInventoryMetrics.ts`, `useComponentFilter.ts`
- `src/data/components.ts`, `src/lib/reorderEngine.ts`

---

## UI Layout

```
┌─────────────────────────────────────────────────────────┐
│  KPI strip: Total Items | Total Value | Critical | Warn │
├─────────────────────────────────────────────────────────┤
│  [All] [Filament] [Inserts] [Spare Parts]    [+ Add]   │
├─────────────────────────────────────────────────────────┤
│  Search box                                             │
├─────────────────────────────────────────────────────────┤
│  Table columns (desktop):                               │
│    Name | Category | Stock | Safety Stock | Status |   │
│    Material/Color (Filament) | Size/Type (Insert) | ✏️  │
└─────────────────────────────────────────────────────────┘
```

Mobile: card view, same pattern as existing InventoryTable.

---

## Add/Edit Form

- Opens as modal on "+ Add" or row edit (pencil icon)
- Required fields: Name, Category, Unit, Current Stock, Safety Stock, Reorder Qty, Lead Time
- Category selector dynamically shows:
  - Filament: Material (dropdown: PLA/PETG/ABS/TPU/ASA/Other) + Color (free text)
  - Insert: Insert Size (dropdown: M2/M3/M4/M5/Other) + Insert Type (dropdown: Heat-Set/Knurled/Threaded)
  - Spare Part: no extra fields
- Optional fields: Supplier, Unit Cost
- Delete button on edit form with inline confirmation

---

## localStorage

Key: `mfg-print-inventory`
Value: `PrintItem[]` (JSON)

On first load, if key is absent, seed from `src/data/printInventory.ts`.
