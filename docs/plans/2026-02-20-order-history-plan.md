# Order History Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the static "Purchase Orders" tab with a live "Order History" tab that accepts Etsy `EtsySoldOrderItems` CSV exports, displays items in a grouped table with clickable buyer filtering, and shares uploaded data with the Sales Map.

**Architecture:** `useSalesOrders` is lifted to `App.tsx` and stores `EtsyOrderItem[]` (item-level). The Sales Map derives order-level `SaleRecord[]` via a new `toSaleRecords()` helper so its existing stats functions are unchanged. Order History consumes `EtsyOrderItem[]` directly for item-level display. Deduplication uses `transactionId` (unique per CSV row) instead of `orderId`.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vite, Lucide icons. No test framework — verify each task in the browser with `npm run dev`.

---

## Task 1: Add `EtsyOrderItem` to types

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Add the new type**

Add `EtsyOrderItem` after the existing `SaleRecord` interface. Keep `SaleRecord` as-is — it is still used by Sales Map stats functions.

```ts
export interface EtsyOrderItem {
  transactionId: string; // unique per CSV row — dedup key
  orderId: string;
  saleDate: string;       // raw from CSV e.g. "12/30/25"
  itemName: string;
  shipName: string;       // from "Ship Name" col, preferred over Buyer username
  quantity: number;
  price: number;          // per unit
  discountAmount: number;
  shipping: number;       // order-level shipping (repeated per item)
  itemTotal: number;
  dateShipped: string;    // empty string if not yet shipped
  shipCity: string;
  shipState: string;
  shipCountry: string;
}
```

**Step 2: Verify TypeScript**

```bash
npm run build 2>&1 | head -30
```

Expected: no new errors (we only added a type, nothing uses it yet).

**Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(order-history): add EtsyOrderItem type"
```

---

## Task 2: Update `parseSalesCsv.ts` — fix column indices, return `EtsyOrderItem`

**Files:**
- Modify: `src/lib/parseSalesCsv.ts`

The existing column indices are wrong for the `EtsySoldOrderItems` format. Replace the entire file.

**Step 1: Replace the file**

```ts
import type { EtsyOrderItem } from '@/types';

// Column indices for the Etsy "EtsySoldOrderItems" CSV export
const COL = {
  saleDate: 0,         // "Sale Date"     e.g. "12/30/25"
  itemName: 1,         // "Item Name"
  buyer: 2,            // "Buyer"         username, may be empty
  quantity: 3,         // "Quantity"
  price: 4,            // "Price"         per unit
  discountAmount: 7,   // "Discount Amount"
  shipping: 9,         // "Order Shipping"
  itemTotal: 11,       // "Item Total"
  transactionId: 13,   // "Transaction ID" unique per row
  dateShipped: 16,     // "Date Shipped"  may be empty
  shipName: 17,        // "Ship Name"
  shipCity: 20,        // "Ship City"
  shipState: 21,       // "Ship State"
  shipCountry: 23,     // "Ship Country"
  orderId: 24,         // "Order ID"
} as const;

/** Splits a single CSV line respecting double-quoted values. */
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

function parseRow(fields: string[]): EtsyOrderItem | null {
  const transactionId = fields[COL.transactionId]?.trim();
  if (!transactionId) return null;
  return {
    transactionId,
    orderId: fields[COL.orderId]?.trim() ?? '',
    saleDate: fields[COL.saleDate]?.trim() ?? '',
    itemName: fields[COL.itemName]?.trim() ?? '',
    shipName: fields[COL.shipName]?.trim() ?? fields[COL.buyer]?.trim() ?? '',
    quantity: parseInt(fields[COL.quantity] ?? '1', 10) || 1,
    price: parseFloat(fields[COL.price] ?? '0') || 0,
    discountAmount: parseFloat(fields[COL.discountAmount] ?? '0') || 0,
    shipping: parseFloat(fields[COL.shipping] ?? '0') || 0,
    itemTotal: parseFloat(fields[COL.itemTotal] ?? '0') || 0,
    dateShipped: fields[COL.dateShipped]?.trim() ?? '',
    shipCity: fields[COL.shipCity]?.trim() ?? '',
    shipState: fields[COL.shipState]?.trim() ?? '',
    shipCountry: fields[COL.shipCountry]?.trim() ?? '',
  };
}

export interface ParseResult {
  records: EtsyOrderItem[];
  parseErrors: number;
}

export function parseSalesCsv(text: string): ParseResult {
  const lines = text.split('\n').filter(Boolean);
  const [, ...dataLines] = lines; // skip header row
  let parseErrors = 0;
  const records: EtsyOrderItem[] = [];
  for (const line of dataLines) {
    const fields = splitCsvLine(line.trim());
    const record = parseRow(fields);
    if (record) {
      records.push(record);
    } else {
      parseErrors++;
    }
  }
  return { records, parseErrors };
}
```

**Step 2: Build**

```bash
npm run build 2>&1 | head -40
```

Expected: TypeScript errors on `useSalesOrders.ts` and `SalesMapUpload.tsx` because they still reference `SaleRecord`. Fix those in the next tasks.

**Step 3: Commit**

```bash
git add src/lib/parseSalesCsv.ts
git commit -m "feat(order-history): fix parseSalesCsv column indices, return EtsyOrderItem"
```

---

## Task 3: Update `useSalesOrders.ts` — use `EtsyOrderItem`, dedup on `transactionId`

**Files:**
- Modify: `src/hooks/useSalesOrders.ts`

`SaleRecord` → `EtsyOrderItem`. Dedup key changes from `orderId` to `transactionId` (since multiple items share the same `orderId`).

**Step 1: Replace the file**

```ts
import { useState, useCallback } from 'react';
import type { EtsyOrderItem } from '@/types';

const STORAGE_KEY = 'salesmap_orders';

function load(): EtsyOrderItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as EtsyOrderItem[];
  } catch {
    return [];
  }
}

function save(records: EtsyOrderItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export interface MergeResult {
  added: number;
  duplicates: number;
}

export function useSalesOrders() {
  const [orders, setOrders] = useState<EtsyOrderItem[]>(() => load());

  const merge = useCallback((incoming: EtsyOrderItem[]): MergeResult => {
    const existing = load();
    const existingIds = new Set(existing.map((r) => r.transactionId));
    const newRecords = incoming.filter((r) => !existingIds.has(r.transactionId));
    const merged = [...existing, ...newRecords];
    save(merged);
    setOrders(merged);
    return { added: newRecords.length, duplicates: incoming.length - newRecords.length };
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setOrders([]);
  }, []);

  return { orders, merge, clear };
}
```

**Step 2: Build**

```bash
npm run build 2>&1 | head -40
```

Expected: errors in `SalesMapView.tsx` (uses `o.orderValue`) and `salesMapData.ts` (accepts `SaleRecord[]`). Next tasks fix these.

**Step 3: Commit**

```bash
git add src/hooks/useSalesOrders.ts
git commit -m "feat(order-history): update useSalesOrders to EtsyOrderItem, dedup on transactionId"
```

---

## Task 4: Add `toSaleRecords` helper to `salesMapData.ts`

**Files:**
- Modify: `src/lib/salesMapData.ts`

The Sales Map stats functions (`statsByUsState`, `statsByCountry`) accept `SaleRecord[]` and must not change. Add a `toSaleRecords` converter that groups `EtsyOrderItem[]` by `orderId` for the Sales Map to use.

**Step 1: Add the import and helper at the top of the file, below the existing import**

After `import { STATE_ABBR_TO_NAME } from './geoLookup';` add:

```ts
import type { EtsyOrderItem } from '@/types';

/**
 * Converts item-level EtsyOrderItem[] into order-level SaleRecord[]
 * by grouping on orderId. Revenue = sum of itemTotals per order.
 */
export function toSaleRecords(items: EtsyOrderItem[]): SaleRecord[] {
  const map = new Map<string, SaleRecord>();
  for (const item of items) {
    const existing = map.get(item.orderId);
    if (existing) {
      existing.orderValue += item.itemTotal;
      existing.numItems += item.quantity;
    } else {
      map.set(item.orderId, {
        orderId: item.orderId,
        saleDate: item.saleDate,
        fullName: item.shipName,
        shipCity: item.shipCity,
        shipState: item.shipState,
        shipCountry: item.shipCountry,
        orderValue: item.itemTotal,
        numItems: item.quantity,
      });
    }
  }
  return [...map.values()];
}
```

Also add `import type { SaleRecord } from '@/types';` alongside the existing `EtsyOrderItem` import (or combine them):

```ts
import type { EtsyOrderItem, SaleRecord } from '@/types';
```

**Step 2: Build**

```bash
npm run build 2>&1 | head -40
```

Expected: errors only in `SalesMapView.tsx` now (still uses hook directly and passes `EtsyOrderItem[]` to stats functions). Fix in next task.

**Step 3: Commit**

```bash
git add src/lib/salesMapData.ts
git commit -m "feat(order-history): add toSaleRecords converter to salesMapData"
```

---

## Task 5: Update `SalesMapView.tsx` — accept props, use `toSaleRecords`

**Files:**
- Modify: `src/components/salesmap/SalesMapView.tsx`

Remove the internal `useSalesOrders()` call. Accept `{ orders, merge, clear }` as props. Derive `SaleRecord[]` from `EtsyOrderItem[]` via `toSaleRecords` before passing to stats functions.

**Step 1: Replace the file**

```tsx
import { useState, useMemo } from 'react';
import { ShoppingBag, Globe, DollarSign } from 'lucide-react';
import { PageSection } from '@/components/layout/PageSection';
import { KpiCard } from '@/components/kpi/KpiCard';
import { statsByUsState, statsByCountry, toSaleRecords } from '@/lib/salesMapData';
import { SalesMapUpload } from './SalesMapUpload';
import { UsMap } from './UsMap';
import { WorldMap } from './WorldMap';
import { SalesBreakdownTables } from './SalesBreakdownTables';
import type { EtsyOrderItem } from '@/types';
import type { MergeResult } from '@/hooks/useSalesOrders';

type MapView = 'us' | 'world';

function extractYear(saleDate: string): string {
  const yr = saleDate.split('/')[2] ?? '';
  return yr.length === 2 ? `20${yr}` : yr;
}

interface SalesMapViewProps {
  isDark: boolean;
  orders: EtsyOrderItem[];
  onMerge: (records: EtsyOrderItem[]) => MergeResult;
  onClear: () => void;
}

export function SalesMapView({ isDark, orders, onMerge, onClear }: SalesMapViewProps) {
  const [mapView, setMapView] = useState<MapView>('us');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  const availableYears = useMemo(() => {
    const years = new Set(orders.map((o) => extractYear(o.saleDate)).filter(Boolean));
    return [...years].sort().reverse();
  }, [orders]);

  const filteredItems = useMemo(
    () => (selectedYear === 'all' ? orders : orders.filter((o) => extractYear(o.saleDate) === selectedYear)),
    [orders, selectedYear]
  );

  // Aggregate to order-level for Sales Map stats (preserves existing map semantics)
  const filteredOrders = useMemo(() => toSaleRecords(filteredItems), [filteredItems]);

  const stateStats = useMemo(() => statsByUsState(filteredOrders), [filteredOrders]);
  const countryStats = useMemo(() => statsByCountry(filteredOrders), [filteredOrders]);
  const totalRevenue = useMemo(
    () => filteredOrders.reduce((sum, o) => sum + o.orderValue, 0),
    [filteredOrders]
  );

  return (
    <>
      <PageSection title="Upload">
        <SalesMapUpload onMerge={onMerge} onClear={onClear} totalOrders={orders.length} />
      </PageSection>

      {orders.length > 0 ? (
        <>
          {availableYears.length > 1 && (
            <PageSection title="Filter by Year">
              <div className="flex flex-wrap gap-2">
                {(['all', ...availableYears] as const).map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setSelectedYear(yr)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border-none ${
                      selectedYear === yr
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {yr === 'all' ? 'All Years' : yr}
                  </button>
                ))}
              </div>
            </PageSection>
          )}

          <PageSection title="Summary">
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <KpiCard
                label="Total Orders"
                value={filteredOrders.length.toLocaleString()}
                icon={<ShoppingBag size={18} />}
                accent="blue"
              />
              <KpiCard
                label="Total Revenue"
                value={`$${totalRevenue.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
                icon={<DollarSign size={18} />}
                accent="green"
              />
              <KpiCard
                label="Countries"
                value={countryStats.length}
                icon={<Globe size={18} />}
                accent="blue"
              />
            </div>
          </PageSection>

          <PageSection title="Map">
            <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-4 shadow-sm">
              <div className="flex gap-2 mb-4">
                {(['us', 'world'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setMapView(v)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border-none ${
                      mapView === v
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {v === 'us' ? 'US States' : 'World'}
                  </button>
                ))}
              </div>
              {mapView === 'us' ? (
                <UsMap stats={stateStats} isDark={isDark} />
              ) : (
                <WorldMap stats={countryStats} isDark={isDark} />
              )}
            </div>
          </PageSection>

          <PageSection title="Breakdown">
            <SalesBreakdownTables countryStats={countryStats} stateStats={stateStats} />
          </PageSection>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
          <Globe size={48} className="mb-4 opacity-30" />
          <p className="text-base font-medium">No sales data yet</p>
          <p className="text-sm mt-1">Upload an Etsy sold-orders CSV above to get started</p>
        </div>
      )}
    </>
  );
}
```

**Step 2: Build**

```bash
npm run build 2>&1 | head -40
```

Expected: errors in `Dashboard.tsx` because `SalesMapView` now requires `orders/onMerge/onClear` props it isn't receiving yet.

**Step 3: Commit**

```bash
git add src/components/salesmap/SalesMapView.tsx
git commit -m "feat(order-history): SalesMapView accepts shared orders props"
```

---

## Task 6: Lift `useSalesOrders` to `App.tsx`, thread through `Dashboard`

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/Dashboard.tsx`

**Step 1: Update `App.tsx`**

```tsx
import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Dashboard } from '@/pages/Dashboard';
import { useInventoryMetrics } from '@/hooks/useInventoryMetrics';
import { useTheme } from '@/hooks/useTheme';
import { useSalesOrders } from '@/hooks/useSalesOrders';

export type View = 'dashboard' | 'inventory' | 'orders' | 'charts' | 'seo' | 'salesmap' | 'margin';

function App() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const { criticalCount } = useInventoryMetrics();
  const { isDark, toggle } = useTheme();
  const { orders: salesOrders, merge: mergeSalesOrders, clear: clearSalesOrders } = useSalesOrders();

  return (
    <div className="h-dvh flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white overflow-hidden">
      <Header criticalCount={criticalCount} isDark={isDark} onThemeToggle={toggle} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
        <Dashboard
          activeView={activeView}
          isDark={isDark}
          salesOrders={salesOrders}
          onMergeSalesOrders={mergeSalesOrders}
          onClearSalesOrders={clearSalesOrders}
        />
      </div>
      <BottomNav activeView={activeView} onViewChange={setActiveView} />
    </div>
  );
}

export default App;
```

**Step 2: Update `Dashboard.tsx`**

Add the new props and thread them to `SalesMapView` and the upcoming `OrderHistoryView`. Also swap `OrdersView` for `OrderHistoryView` and update the section title.

```tsx
import { useState } from 'react';
import { useInventoryMetrics } from '@/hooks/useInventoryMetrics';
import { consumptionRecords } from '@/data';
import type { View } from '@/App';
import type { EtsyOrderItem } from '@/types';
import type { MergeResult } from '@/hooks/useSalesOrders';

import { KpiCardGrid } from '@/components/kpi/KpiCardGrid';
import { ReorderAlertsPanel } from '@/components/alerts/ReorderAlertsPanel';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { OrderHistoryView } from '@/components/orders/OrderHistoryView';
import { ConsumptionTrendChart } from '@/components/charts/ConsumptionTrendChart';
import { InventoryLevelChart } from '@/components/charts/InventoryLevelChart';
import { ChartComponentSelector } from '@/components/charts/ChartComponentSelector';
import { PageSection } from '@/components/layout/PageSection';
import { EtsySeoTool } from '@/components/seo/EtsySeoTool';
import { SalesMapView } from '@/components/salesmap/SalesMapView';
import { MarginCalculatorView } from '@/components/margin/MarginCalculatorView';

interface DashboardProps {
  activeView: View;
  isDark: boolean;
  salesOrders: EtsyOrderItem[];
  onMergeSalesOrders: (records: EtsyOrderItem[]) => MergeResult;
  onClearSalesOrders: () => void;
}

export function Dashboard({ activeView, isDark, salesOrders, onMergeSalesOrders, onClearSalesOrders }: DashboardProps) {
  const metrics = useInventoryMetrics();
  const { enrichedComponents } = metrics;
  const [selectedChartCompId, setSelectedChartCompId] = useState(enrichedComponents[0]?.id ?? '');
  const selectedComp = enrichedComponents.find((c) => c.id === selectedChartCompId);

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-blue-100/60 dark:from-blue-950/20 to-transparent" />

      <div className="relative px-4 sm:px-6 pt-5 pb-24 md:pb-8">
        {activeView === 'dashboard' && (
          <>
            <PageSection title="Overview">
              <KpiCardGrid metrics={metrics} />
            </PageSection>
            <PageSection title="Reorder Alerts">
              <ReorderAlertsPanel components={enrichedComponents} />
            </PageSection>
            <PageSection title="Inventory">
              <InventoryTable components={enrichedComponents} />
            </PageSection>
          </>
        )}

        {activeView === 'inventory' && (
          <PageSection title="Inventory Management">
            <InventoryTable components={enrichedComponents} />
          </PageSection>
        )}

        {activeView === 'orders' && (
          <PageSection title="Order History">
            <OrderHistoryView
              orders={salesOrders}
              onMerge={onMergeSalesOrders}
              onClear={onClearSalesOrders}
            />
          </PageSection>
        )}

        {activeView === 'charts' && (
          <>
            <PageSection title="Consumption Trend">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-slate-500 dark:text-slate-400 text-sm">Component:</span>
                <ChartComponentSelector components={enrichedComponents} selectedId={selectedChartCompId} onChange={setSelectedChartCompId} />
              </div>
              {selectedComp && (
                <ConsumptionTrendChart
                  componentId={selectedComp.id}
                  componentName={selectedComp.name}
                  records={consumptionRecords}
                  avgDaily={selectedComp.avgDailyConsumption}
                  isDark={isDark}
                />
              )}
            </PageSection>
            <PageSection title="Inventory Level Analysis">
              <InventoryLevelChart components={enrichedComponents} isDark={isDark} />
            </PageSection>
          </>
        )}

        {activeView === 'seo' && (
          <EtsySeoTool />
        )}

        {activeView === 'salesmap' && (
          <SalesMapView
            isDark={isDark}
            orders={salesOrders}
            onMerge={onMergeSalesOrders}
            onClear={onClearSalesOrders}
          />
        )}

        {activeView === 'margin' && (
          <MarginCalculatorView />
        )}
      </div>
    </main>
  );
}
```

**Step 3: Build**

```bash
npm run build 2>&1 | head -40
```

Expected: error on `OrderHistoryView` not found — that's next. All other errors should be resolved.

**Step 4: Commit**

```bash
git add src/App.tsx src/pages/Dashboard.tsx
git commit -m "feat(order-history): lift useSalesOrders to App, thread props to Dashboard"
```

---

## Task 7: Create `EtsyOrdersFilters.tsx`

**Files:**
- Create: `src/components/orders/EtsyOrdersFilters.tsx`

**Step 1: Create the file**

```tsx
import { Search } from 'lucide-react';

export interface EtsyFilterState {
  search: string;
  country: string;
  shipped: 'all' | 'shipped' | 'unshipped';
}

interface EtsyOrdersFiltersProps {
  filters: EtsyFilterState;
  countries: string[];
  onChange: (f: EtsyFilterState) => void;
}

export function EtsyOrdersFilters({ filters, countries, onChange }: EtsyOrdersFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {/* Search */}
      <div className="relative flex-1 min-w-40">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search item, buyer, city…"
          className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
      </div>

      {/* Country */}
      <select
        value={filters.country}
        onChange={(e) => onChange({ ...filters, country: e.target.value })}
        className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      >
        <option value="All">All Countries</option>
        {countries.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {/* Shipped toggle */}
      <select
        value={filters.shipped}
        onChange={(e) => onChange({ ...filters, shipped: e.target.value as EtsyFilterState['shipped'] })}
        className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      >
        <option value="all">All Statuses</option>
        <option value="shipped">Shipped</option>
        <option value="unshipped">Unshipped</option>
      </select>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/orders/EtsyOrdersFilters.tsx
git commit -m "feat(order-history): add EtsyOrdersFilters component"
```

---

## Task 8: Create `EtsyOrdersTable.tsx`

**Files:**
- Create: `src/components/orders/EtsyOrdersTable.tsx`

Groups rows by `orderId` (Order ID shown only on first row of each order). Buyer name is clickable to set a buyer filter.

**Step 1: Create the file**

```tsx
import type { EtsyOrderItem } from '@/types';

interface EtsyOrdersTableProps {
  items: EtsyOrderItem[];
  activeBuyer: string | null;
  onBuyerClick: (name: string) => void;
}

export function EtsyOrdersTable({ items, activeBuyer, onBuyerClick }: EtsyOrdersTableProps) {
  // Group items preserving order, track which orderId we've already shown
  const seenOrderIds = new Set<string>();

  return (
    <>
      {/* Mobile card view */}
      <div className="sm:hidden flex flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.transactionId}
            className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 p-3 shadow-sm dark:shadow-none"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="text-slate-900 dark:text-slate-200 text-sm font-semibold leading-tight">{item.itemName}</p>
                <button
                  onClick={() => onBuyerClick(item.shipName)}
                  className={`text-[10px] mt-0.5 hover:underline cursor-pointer bg-transparent border-none p-0 text-left ${
                    activeBuyer === item.shipName ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-400'
                  }`}
                >
                  {item.shipName}
                </button>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                item.dateShipped
                  ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-500/15 dark:text-green-400 dark:border-green-600/40'
                  : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-600/40'
              }`}>
                {item.dateShipped ? 'Shipped' : 'Pending'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Qty', value: item.quantity },
                { label: 'Total', value: `$${item.itemTotal.toFixed(2)}` },
                { label: 'City', value: item.shipCity || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2">
                  <p className="text-slate-400 text-[9px] uppercase tracking-wider">{label}</p>
                  <p className="text-slate-800 dark:text-slate-200 text-[10px] font-semibold mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-center py-8 text-slate-400 text-sm">No items match the filters.</p>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden shadow-sm dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700/60">
              <tr>
                {['Order ID', 'Item', 'Buyer', 'Qty', 'Total', 'Shipped', 'Country'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isFirstOfOrder = !seenOrderIds.has(item.orderId);
                if (isFirstOfOrder) seenOrderIds.add(item.orderId);

                return (
                  <tr
                    key={item.transactionId}
                    className="border-b border-slate-100 dark:border-slate-700/30 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors"
                  >
                    <td className="px-3 py-3 text-slate-400 text-xs font-mono">
                      {isFirstOfOrder ? item.orderId : <span className="text-slate-200 dark:text-slate-700">↳</span>}
                    </td>
                    <td className="px-3 py-3 text-slate-800 dark:text-slate-200 text-xs max-w-xs truncate">{item.itemName}</td>
                    <td className="px-3 py-3 text-xs">
                      <button
                        onClick={() => onBuyerClick(item.shipName)}
                        className={`hover:underline cursor-pointer bg-transparent border-none p-0 text-left ${
                          activeBuyer === item.shipName
                            ? 'text-blue-600 dark:text-blue-400 font-semibold'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {item.shipName}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300 font-mono text-xs">{item.quantity}</td>
                    <td className="px-3 py-3 text-slate-700 dark:text-slate-300 font-mono text-xs font-semibold">
                      ${item.itemTotal.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {item.dateShipped ? (
                        <span className="text-green-600 dark:text-green-400 font-mono">{item.dateShipped}</span>
                      ) : (
                        <span className="text-blue-500 dark:text-blue-400">Pending</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-slate-500 dark:text-slate-400 text-xs">{item.shipCountry}</td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 text-sm">
                    No items match the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/orders/EtsyOrdersTable.tsx
git commit -m "feat(order-history): add EtsyOrdersTable with order grouping and buyer click"
```

---

## Task 9: Create `OrderHistoryView.tsx`

**Files:**
- Create: `src/components/orders/OrderHistoryView.tsx`

Composes upload zone, filter bar, summary line, buyer chip, and table. Also handles the empty state when no CSV is loaded.

**Step 1: Create the file**

```tsx
import { useState, useMemo } from 'react';
import { ShoppingBag, X } from 'lucide-react';
import { SalesMapUpload } from '@/components/salesmap/SalesMapUpload';
import { EtsyOrdersFilters } from './EtsyOrdersFilters';
import { EtsyOrdersTable } from './EtsyOrdersTable';
import type { EtsyFilterState } from './EtsyOrdersFilters';
import type { EtsyOrderItem } from '@/types';
import type { MergeResult } from '@/hooks/useSalesOrders';

interface OrderHistoryViewProps {
  orders: EtsyOrderItem[];
  onMerge: (records: EtsyOrderItem[]) => MergeResult;
  onClear: () => void;
}

export function OrderHistoryView({ orders, onMerge, onClear }: OrderHistoryViewProps) {
  const [filters, setFilters] = useState<EtsyFilterState>({
    search: '',
    country: 'All',
    shipped: 'all',
  });
  const [activeBuyer, setActiveBuyer] = useState<string | null>(null);

  const countries = useMemo(
    () => Array.from(new Set(orders.map((o) => o.shipCountry).filter(Boolean))).sort(),
    [orders],
  );

  const filtered = useMemo(() => {
    return orders.filter((item) => {
      const q = filters.search.toLowerCase();
      const matchesSearch =
        q === '' ||
        item.itemName.toLowerCase().includes(q) ||
        item.shipName.toLowerCase().includes(q) ||
        item.shipCity.toLowerCase().includes(q);

      const matchesCountry = filters.country === 'All' || item.shipCountry === filters.country;

      const matchesShipped =
        filters.shipped === 'all' ||
        (filters.shipped === 'shipped' && item.dateShipped !== '') ||
        (filters.shipped === 'unshipped' && item.dateShipped === '');

      const matchesBuyer = activeBuyer === null || item.shipName === activeBuyer;

      return matchesSearch && matchesCountry && matchesShipped && matchesBuyer;
    });
  }, [orders, filters, activeBuyer]);

  // Summary stats for active buyer chip
  const buyerSummary = useMemo(() => {
    if (!activeBuyer) return null;
    const buyerItems = orders.filter((o) => o.shipName === activeBuyer);
    const uniqueOrders = new Set(buyerItems.map((o) => o.orderId)).size;
    const total = buyerItems.reduce((sum, o) => sum + o.itemTotal, 0);
    return { uniqueOrders, total };
  }, [activeBuyer, orders]);

  const uniqueOrderCount = useMemo(
    () => new Set(filtered.map((o) => o.orderId)).size,
    [filtered],
  );

  function handleBuyerClick(name: string) {
    setActiveBuyer((prev) => (prev === name ? null : name));
  }

  return (
    <div>
      {/* Upload zone — always visible */}
      <div className="mb-4">
        <SalesMapUpload onMerge={onMerge} onClear={onClear} totalOrders={orders.length} />
      </div>

      {orders.length === 0 ? (
        // Empty state
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
          <ShoppingBag size={48} className="mb-4 opacity-30" />
          <p className="text-base font-medium">No order history yet</p>
          <p className="text-sm mt-1">Upload an Etsy sold-order-items CSV above to get started</p>
        </div>
      ) : (
        <>
          <EtsyOrdersFilters filters={filters} countries={countries} onChange={setFilters} />

          {/* Active buyer chip */}
          {activeBuyer && buyerSummary && (
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-600/40 rounded-full text-xs font-medium">
                {activeBuyer}
                <span className="text-blue-500 dark:text-blue-500">·</span>
                {buyerSummary.uniqueOrders} {buyerSummary.uniqueOrders === 1 ? 'order' : 'orders'}
                <span className="text-blue-500 dark:text-blue-500">·</span>
                ${buyerSummary.total.toFixed(2)} total
                <button
                  onClick={() => setActiveBuyer(null)}
                  className="ml-1 hover:text-blue-900 dark:hover:text-blue-200 cursor-pointer bg-transparent border-none p-0"
                >
                  <X size={12} />
                </button>
              </span>
            </div>
          )}

          {/* Summary line */}
          <p className="text-slate-500 dark:text-slate-400 text-xs mb-2">
            Showing {filtered.length} {filtered.length === 1 ? 'item' : 'items'} across {uniqueOrderCount} {uniqueOrderCount === 1 ? 'order' : 'orders'}
          </p>

          <EtsyOrdersTable items={filtered} activeBuyer={activeBuyer} onBuyerClick={handleBuyerClick} />
        </>
      )}
    </div>
  );
}
```

**Step 2: Build**

```bash
npm run build 2>&1 | head -40
```

Expected: clean build (all types resolved).

**Step 3: Verify in browser**

```bash
npm run dev
```

- Navigate to "Order History" tab — empty state should show
- Upload `EtsySoldOrderItems2025.csv` — table populates
- Search "Car Trim" — filters to matching items
- Click a buyer name — chip appears with order count + total
- Click the × on the chip — buyer filter clears
- Navigate to Sales Map — same data should be loaded (upload once, shared)

**Step 4: Commit**

```bash
git add src/components/orders/OrderHistoryView.tsx
git commit -m "feat(order-history): add OrderHistoryView with upload, filters, buyer chip"
```

---

## Task 10: Update navigation labels

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/BottomNav.tsx`

**Step 1: Update `Sidebar.tsx`**

Change line:
```ts
{ id: 'orders', label: 'Purchase Orders', Icon: ShoppingCart },
```
to:
```ts
{ id: 'orders', label: 'Order History', Icon: ShoppingCart },
```

**Step 2: Update `BottomNav.tsx`**

Change line:
```ts
{ id: 'orders', label: 'Orders', Icon: ShoppingCart },
```
to:
```ts
{ id: 'orders', label: 'Order History', Icon: ShoppingCart },
```

**Step 3: Verify in browser**

Sidebar and bottom nav both read "Order History".

**Step 4: Commit**

```bash
git add src/components/layout/Sidebar.tsx src/components/layout/BottomNav.tsx
git commit -m "feat(order-history): rename Purchase Orders → Order History in navigation"
```

---

## Task 11: Remove old orders components

**Files:**
- Delete: `src/components/orders/OrdersView.tsx`
- Delete: `src/components/orders/OrdersTable.tsx`
- Delete: `src/components/orders/OrdersFilters.tsx`

These files are no longer imported anywhere after Task 6 updated `Dashboard.tsx`.

**Step 1: Verify they are unreferenced**

```bash
grep -r "OrdersView\|OrdersTable\|OrdersFilters" src/
```

Expected: no matches.

**Step 2: Delete the files**

```bash
rm "src/components/orders/OrdersView.tsx" \
   "src/components/orders/OrdersTable.tsx" \
   "src/components/orders/OrdersFilters.tsx"
```

**Step 3: Final build**

```bash
npm run build 2>&1
```

Expected: clean build, zero errors.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove old OrdersView, OrdersTable, OrdersFilters components"
```

---

## Task 12: Final verification

**Step 1: Full walkthrough in browser**

```bash
npm run dev
```

Check each item:
- [ ] Sidebar shows "Order History" (not "Purchase Orders")
- [ ] Bottom nav shows "Order History" on mobile
- [ ] Order History tab shows upload prompt when no data loaded
- [ ] Upload `EtsySoldOrderItems2025.csv` — table populates with item rows
- [ ] Orders sharing an `orderId` show the ID only on the first row; subsequent rows show `↳`
- [ ] Search filters by item name, buyer name, city
- [ ] Country dropdown filters correctly
- [ ] Shipped toggle shows only shipped or unshipped items
- [ ] Clicking a buyer name sets the buyer chip with order count + total spend
- [ ] Clicking the × on the chip clears the buyer filter
- [ ] Clicking the same buyer name again also clears the filter
- [ ] Navigate to Sales Map — data loaded from same upload
- [ ] Refresh page — data persists (localStorage)
- [ ] Clear All on either tab clears both

**Step 2: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(order-history): final verification fixes"
```
