# Dashboard Redesign — Business Overview
**Date:** 2026-02-20
**Approach:** Morning Briefing (Approach A — stacked priority)

## Goal
Replace the current inventory-only dashboard with a full business overview that answers three questions in order:
1. What needs my attention right now?
2. How is the business performing?
3. Am I on top of operations?

---

## Section 1: Urgent Alerts

A horizontal strip at the very top. Cards only render when there is something to act on. If all clear, a single green "All Clear" card is shown.

**Alert cards (red = critical, amber = warning):**
- **Unshipped Orders** — `salesOrders.filter(o => o.dateShipped === '').map(o => o.orderId)` unique count
- **Critical Inventory** — `criticalCount` (components) + `printKpis.critical` (print inventory)
- **Reorder Warnings** — `warningCount` (components) + `printKpis.warning` (print inventory)

Each card navigates to the relevant tab on click (`orders`, `inventory`).

---

## Section 2: Business Performance

### KPI Strip (4 cards)
| Card | Metric | Source |
|---|---|---|
| Revenue (30 days) | Sum of `itemTotal` for orders in last 30 days | `salesOrders` |
| Revenue (All Time) | Sum of all `itemTotal` | `salesOrders` |
| Orders (30 days) | Unique `orderId` count, last 30 days | `salesOrders` |
| Avg Order Value | All-time revenue ÷ unique order count | `salesOrders` |

### Charts Row (2 panels, side by side)
- **Monthly Revenue bar chart** — last 6 months, grouped by month from `saleDate`, using Recharts `BarChart`
- **Top 5 Items table** — grouped by `itemName`, sorted by revenue desc, columns: item name / units sold / revenue

Empty state: prompt to upload CSV on Orders tab.

---

## Section 3: Operations Health

Four compact status cards in a row.

| Card | Content | Source |
|---|---|---|
| Fulfillment | "X of Y orders shipped" + progress bar; red if unshipped > 5 | `salesOrders` |
| Component Inventory | Healthy / Warning / Critical counts | `useInventoryMetrics` |
| Print Inventory | Healthy / Warning / Critical counts | `usePrintInventory` |
| Top Market | Top 3 countries by order count | `salesOrders` |

Each card has a nav arrow (→) to the relevant tab.

---

## Data Sources & Hooks

| Data | Hook / Prop | Persisted |
|---|---|---|
| Component inventory | `useInventoryMetrics()` | Static data files |
| Print inventory | `usePrintInventory()` | localStorage |
| Sales orders | `salesOrders` prop (already in Dashboard) | localStorage |

**New hook needed:** `useDashboardSalesMetrics(orders: EtsyOrderItem[])` — computes:
- `revenue30d`, `revenueAllTime`
- `orders30d`, `avgOrderValue`
- `monthlyRevenue` (array of `{ month: string; revenue: number }` for last 6 months)
- `topItems` (array of `{ name: string; units: number; revenue: number }` top 5)
- `unshippedCount`
- `topCountries` (array of `{ country: string; count: number }` top 3)

---

## Architecture

- **No new pages** — all changes within `Dashboard.tsx` (`activeView === 'dashboard'` block)
- **New hook:** `src/hooks/useDashboardSalesMetrics.ts`
- **New components:**
  - `src/components/dashboard/AlertsStrip.tsx`
  - `src/components/dashboard/PerformanceSection.tsx` (KPI strip + charts)
  - `src/components/dashboard/OperationsHealthSection.tsx`
- **Reuse:** existing `KpiCard`, `PageSection`, Recharts already installed

---

## Empty States
- If `salesOrders.length === 0`: Performance and Fulfillment/Top Market cards show "Upload orders CSV to see data"
- If all inventory healthy: Alerts strip shows green "All Clear"
