# Margin Calculator — Design Document

**Date:** 2026-02-19
**Status:** Approved

---

## Overview

A new "Margin Calculator" tab that lets users calculate the profit margin for a 3D-printed Etsy listing. Variables include filament type/amount, print time, electricity cost, packaging, hardware add-ons, and Etsy platform fees. Results include a donut-chart cost breakdown and a two-way live margin display (sale price ↔ target margin).

---

## 1. Navigation & Wiring

- Add `'margin'` to the `View` union in `src/App.tsx`
- Add nav item (`Calculator` icon from lucide-react) to `src/components/layout/Sidebar.tsx` and `src/components/layout/BottomNav.tsx`
- Render `<MarginCalculatorView />` in `src/pages/Dashboard.tsx` under `activeView === 'margin'`
- New file: `src/components/margin/MarginCalculatorView.tsx` (entire feature self-contained, matching `EtsySeoTool.tsx` pattern)

---

## 2. Data Model (localStorage)

### Filament Library

Editable list persisted to `localStorage` under key `margin_filament_library`.

```ts
interface FilamentPreset {
  id: string;
  name: string;       // e.g. "PLA", "PETG"
  costPerKg: number;  // e.g. 22.00
}
```

**Default presets:**

| Name   | $/kg |
|--------|------|
| PLA    | 22   |
| PETG   | 26   |
| ASA    | 28   |
| ABS    | 24   |
| TPU    | 35   |
| Resin  | 40   |

### Saved Product Presets

Persisted to `localStorage` under key `margin_presets`. Array of:

```ts
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
```

### Etsy Fee Constants (not stored — computed at results layer)

| Fee                  | Value                  |
|----------------------|------------------------|
| Listing fee          | $0.20 (fixed)          |
| Transaction fee      | 6.5% of sale price     |
| Payment processing   | 3% of sale price + $0.25 |

---

## 3. Input Sections (top-to-bottom card layout)

### 3.1 Preset Bar
- Dropdown to load a named saved preset
- "Save as..." button — prompts for a name, stores current state
- "New" button — clears all fields to defaults

### 3.2 Filament & Materials
- Picker (dropdown) from the filament library
- Grams input (number)
- Computed filament cost shown inline: `(grams / 1000) × costPerKg`
- "Edit Library" button → modal/panel to add, edit, delete filament types with cost/kg

### 3.3 Print Settings
- Print time — hours (number input)
- Printer wattage — watts (number input, default 250W)
- Electricity rate — $/kWh (number input, default 0.13)
- Computed electricity cost shown inline: `hours × (watts / 1000) × kwHRate`

### 3.4 Packaging
- Single cost input ($/unit)

### 3.5 Hardware Add-ons
- Repeatable line items: name (text) + cost per unit (number)
- "Add item" button appends a new row
- Each row has a remove (×) button
- Examples: "M3 screws — $0.12", "Magnet — $0.08"

### 3.6 Etsy Fees (display only in inputs section)
- Read-only breakdown showing:
  - Listing fee: $0.20 (fixed)
  - Transaction fee: 6.5% of sale price (computed in results)
  - Payment processing: 3% + $0.25 (computed in results)
- Informational note that % fees are applied to sale price and shown live in results

---

## 4. Results Panel

Layout: sticky bottom bar on mobile, inline section below inputs on desktop (or side panel if viewport is wide enough).

### 4.1 Donut Chart
Recharts `PieChart` with slices for:
- Filament cost
- Electricity cost
- Packaging cost
- Hardware cost
- Etsy fees (combined: listing + transaction + processing)

### 4.2 Total Cost
Sum of: filament + electricity + packaging + hardware + $0.20 listing fee. Displayed prominently above the two-way inputs.

### 4.3 Two-Way Live Inputs
Two fields side by side that update each other in real time:

- **Sale Price ($)** — user types a price → computes margin % and profit $
- **Target Margin (%)** — user types a desired margin → computes required sale price

The "required sale price" formula must account for the fact that transaction (6.5%) and processing (3%) fees are taken from the sale price itself:

```
salePrice = (totalCost + 0.25) / (1 - 0.065 - 0.03 - targetMargin)
```

### 4.4 Margin Badge
Color-coded pill showing computed margin %:
- Red: < 15%
- Yellow: 15–30%
- Green: > 30%

---

## 5. Component Structure

```
src/components/margin/
  MarginCalculatorView.tsx   ← single self-contained component
```

Sub-components (defined inline or in same file):
- `FilamentLibraryModal` — add/edit/delete filament presets
- `HardwareItemRow` — single repeatable hardware line item
- `CostDonutChart` — thin Recharts wrapper
- `ResultsPanel` — two-way margin display + badge

---

## 6. Key Calculations

```ts
const filamentCost = (filamentGrams / 1000) * filamentCostPerKg;
const electricityCost = printHours * (printerWatts / 1000) * kwHRate;
const hardwareCost = hardwareItems.reduce((sum, item) => sum + item.cost, 0);
const baseCost = filamentCost + electricityCost + packagingCost + hardwareCost + 0.20;

// Given sale price → margin
const etsyFees = salePrice * 0.065 + salePrice * 0.03 + 0.25;
const profit = salePrice - baseCost - etsyFees;
const margin = profit / salePrice;

// Given target margin → required sale price
const salePrice = (baseCost + 0.25) / (1 - 0.065 - 0.03 - targetMarginDecimal);
```
