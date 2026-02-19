# Sales Map — Design Document
**Date:** 2026-02-19
**Status:** Approved

## Overview

A new "Sales Map" tab that accepts Etsy sold-orders CSV uploads and renders a geographic choropleth map of all sales. Supports breakdown by US state and by country. Uploaded data persists in localStorage with Order ID-based deduplication.

---

## Data Source

**CSV format:** Etsy sold-orders export (`EtsySoldOrders2025.csv`-style).

**Fields extracted per row:**

| Field | CSV Column |
|---|---|
| `orderId` | `Order ID` |
| `saleDate` | `Sale Date` |
| `fullName` | `Full Name` |
| `shipCity` | `Ship City` |
| `shipState` | `Ship State` |
| `shipCountry` | `Ship Country` |
| `orderValue` | `Order Value` |
| `numItems` | `Number of Items` |

---

## Architecture

### New View

Add `'salesmap'` to the `View` union type in `src/App.tsx`. Wire into `Dashboard.tsx`, `Sidebar.tsx`, and `BottomNav.tsx`.

### Storage

- **Key:** `salesmap_orders`
- **Format:** JSON array of `SaleRecord` objects
- **Deduplication:** Keyed on `orderId`. Existing records are never overwritten by re-upload.
- **Reset:** "Clear All Data" button removes the localStorage key.

### SaleRecord Type (src/types/index.ts)

```ts
export interface SaleRecord {
  orderId: string;
  saleDate: string;
  fullName: string;
  shipCity: string;
  shipState: string;       // 2-letter US state code, or empty
  shipCountry: string;     // Full country name
  orderValue: number;
  numItems: number;
}
```

### Derived Data (computed on render)

- **By state:** `{ stateCode: string; count: number; revenue: number }[]` — filtered to United States orders
- **By country:** `{ country: string; count: number; revenue: number }[]` — all orders

---

## UI Layout

### 1. Upload Bar
- Drag-and-drop or click-to-browse file input (`.csv` only)
- After upload: result badge showing "✓ N new orders added, N duplicates skipped"
- "Clear All Data" button (right-aligned, destructive confirmation)

### 2. KPI Strip
Three cards using existing `KpiCard` component style:
- Total Orders
- Total Revenue
- Countries Reached

### 3. Map Toggle
Pill button group: `US States` | `World` — toggles the active map view.

### 4. Map Panel

**Library:** `react-simple-maps` (SVG-based, no API key, ~50KB)

- **US view:** 50-state choropleth. Zero-order states: light gray. Order states: blue gradient (light → dark = fewer → more). Hover tooltip: state name, order count, revenue.
- **World view:** Country choropleth, same color treatment. Tooltip: country, order count, revenue.

### 5. Breakdown Tables
Two side-by-side tables (stacked on mobile):
- **By Country** — ranked by order count: Country, Orders, Revenue
- **By US State** — ranked by order count: State, Orders, Revenue

### 6. Navigation
- Icon: `Map` from `lucide-react`
- Active color: blue (same as Dashboard/Inventory tabs)
- Added to both `Sidebar` and `BottomNav`

---

## CSV Parsing

Custom parser (no papaparse dependency):
1. Split on newlines, skip header row
2. Handle quoted fields (commas inside quotes)
3. Extract the 8 target fields by column index
4. Skip rows where `Order ID` is empty

---

## Deduplication Logic

On upload:
1. Parse CSV → array of `SaleRecord`
2. Load existing records from localStorage
3. Build a Set of existing `orderId` values
4. Filter new records: keep only those whose `orderId` is not in the Set
5. Merge and save; report counts to UI

---

## Dependencies to Add

| Package | Purpose |
|---|---|
| `react-simple-maps` | SVG choropleth maps |
| `topojson-client` | TopoJSON geo data processing |

No API key required. Both are free and open source.
