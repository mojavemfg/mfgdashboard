# Order History — Design Document

**Date:** 2026-02-20
**Status:** Approved

## Overview

Replace the current static "Purchase Orders" tab with a live "Order History" tab that accepts Etsy `EtsySoldOrderItems` CSV exports. The component purchase order data is removed from this tab. A shared data layer means uploading one CSV populates both Order History and the existing Sales Map.

## Goals

- Rename "Purchase Orders" → "Order History" throughout navigation
- Let users upload Etsy sold-order-items CSV exports to populate the view
- Support repeat-buyer lookup via clickable buyer filter
- Reuse the existing CSV upload infrastructure already in the Sales Map

## Non-Goals

- Persistence across page reloads (sessionStorage only, matching Sales Map)
- Full buyer analytics / "Buyers" sub-tab (future work)
- Keeping the static component PO data (`data/orders.ts`) in this tab

---

## Architecture

`useSalesOrders` is lifted from `SalesMapView` into `App.tsx`. Both `SalesMapView` and the new `OrderHistoryView` receive `{ orders, totalOrders, onMerge, onClear }` as props.

```
App.tsx
  useSalesOrders()           ← lifted here
  ├── Dashboard
  │     ├── SalesMapView     (onMerge, onClear, totalOrders, orders)
  │     └── OrderHistoryView (onMerge, onClear, totalOrders, orders)
```

---

## Data Model

### CSV Format — `EtsySoldOrderItems`

One row per line item (an order with 2 different products = 2 rows sharing the same Order ID).

| Col | Header | Used |
|-----|--------|------|
| 0 | Sale Date | ✓ `MM/DD/YY` |
| 1 | Item Name | ✓ |
| 2 | Buyer | ✓ (username; may be empty) |
| 3 | Quantity | ✓ |
| 4 | Price | ✓ per unit |
| 7 | Discount Amount | ✓ |
| 9 | Order Shipping | ✓ |
| 11 | Item Total | ✓ |
| 16 | Date Shipped | ✓ may be empty |
| 17 | Ship Name | ✓ actual name |
| 20 | Ship City | ✓ |
| 21 | Ship State | ✓ 2-letter |
| 23 | Ship Country | ✓ |
| 24 | Order ID | ✓ |

### `EtsyOrderItem` Type

```ts
interface EtsyOrderItem {
  orderId: string;
  saleDate: string;       // normalized from MM/DD/YY
  itemName: string;
  shipName: string;       // preferred over Buyer username
  quantity: number;
  price: number;          // per unit
  discountAmount: number;
  shipping: number;
  itemTotal: number;
  dateShipped: string;    // empty string if not yet shipped
  shipCity: string;
  shipState: string;
  shipCountry: string;
}
```

`SaleRecord` (used by Sales Map) is updated or derived from `EtsyOrderItem[]` by grouping on `orderId`.

---

## UI Design

### Upload Zone
Same drag-and-drop style as `SalesMapUpload`. Shows merge result (`+N new · N skipped`) and a "Clear All" confirmation button when data is loaded.

### Empty State
When no CSV is loaded, the table area is replaced by a centered prompt with upload instructions. No empty table skeleton.

### Filter Bar
- **Search** — matches item name, ship name, city (case-insensitive)
- **Country** dropdown — derived from loaded data
- **Shipped** toggle — All / Shipped / Unshipped

### Summary Line
`Showing 247 items across 183 orders`

When a buyer filter is active: `Stephanie Dunn · 4 orders · $47.80 total  [×]`

### Table (desktop)

| Order ID | Item | Buyer | Qty | Total | Shipped | Country |
|----------|------|-------|-----|-------|---------|---------|
| 39272… | Car Trim Cable Clip | S. Dunn | 1 | $2.95 | 01/05/26 | US |
| (same) | SmartCap EvoA… | | 1 | $12.95 | 01/05/26 | US |

- Order ID shown only on first row of each order group (ledger style)
- **Buyer name is clickable** — sets a buyer filter, highlights their rows, shows summary chip
- Active buyer chip has an `×` to clear

### Mobile
Card per line item: item name + buyer + total + shipped date. Matches existing card pattern.

---

## Files Changed

| File | Change |
|------|--------|
| `src/App.tsx` | Lift `useSalesOrders`, pass props to Dashboard |
| `src/pages/Dashboard.tsx` | Thread `salesOrders` props to active view |
| `src/hooks/useSalesOrders.ts` | Update `SaleRecord` → `EtsyOrderItem` |
| `src/lib/parseSalesCsv.ts` | Fix column indices, update return type to `EtsyOrderItem` |
| `src/types/index.ts` | Add `EtsyOrderItem`, remove/update `SaleRecord` |
| `src/components/orders/OrdersView.tsx` | Replace with `OrderHistoryView.tsx` |
| `src/components/orders/OrdersTable.tsx` | Replace with `EtsyOrdersTable.tsx` |
| `src/components/orders/OrdersFilters.tsx` | Replace with `EtsyOrdersFilters.tsx` |
| `src/components/salesmap/SalesMapView.tsx` | Accept props instead of owning hook |
| `src/components/layout/Sidebar.tsx` | Label: "Purchase Orders" → "Order History" |
| `src/components/layout/BottomNav.tsx` | Label: "Orders" → "Order History" |
| `src/data/orders.ts` | No longer imported (can be deleted) |
