# Dashboard Business Overview — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the inventory-only dashboard with a three-section "Morning Briefing" that answers: what's urgent, how is revenue, and is operations healthy.

**Architecture:** New `useDashboardSalesMetrics` hook computes sales KPIs from the existing `salesOrders` array. Three new components (`AlertsStrip`, `PerformanceSection`, `OperationsHealthSection`) slot into the `activeView === 'dashboard'` block in `Dashboard.tsx`. A new `onNavigate` prop threads `setActiveView` down from `App.tsx` so alert cards can deep-link to other tabs.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Recharts (already installed), Lucide React (already installed)

---

## Task 1: Add `onNavigate` prop to `Dashboard`

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/Dashboard.tsx`

### Step 1: Add the prop to `DashboardProps` in Dashboard.tsx

Open `src/pages/Dashboard.tsx`. In the `DashboardProps` interface, add:

```typescript
onNavigate: (view: View) => void;
```

Also add it to the destructured params:

```typescript
export function Dashboard({ activeView, isDark, salesOrders, onMergeSalesOrders, onClearSalesOrders, onNavigate }: DashboardProps) {
```

### Step 2: Pass `setActiveView` as `onNavigate` from App.tsx

In `src/App.tsx`, update the `<Dashboard>` JSX:

```tsx
<Dashboard
  activeView={activeView}
  isDark={isDark}
  salesOrders={salesOrders}
  onMergeSalesOrders={mergeSalesOrders}
  onClearSalesOrders={clearSalesOrders}
  onNavigate={setActiveView}
/>
```

### Step 3: Verify types compile

```bash
npx tsc --noEmit
```

Expected: no errors

### Step 4: Commit

```bash
git add src/App.tsx src/pages/Dashboard.tsx
git commit -m "feat(dashboard): thread onNavigate prop from App to Dashboard"
```

---

## Task 2: Create `useDashboardSalesMetrics` hook

**Files:**
- Create: `src/hooks/useDashboardSalesMetrics.ts`

### Step 1: Create the file

`src/hooks/useDashboardSalesMetrics.ts`:

```typescript
import { useMemo } from 'react';
import type { EtsyOrderItem } from '@/types';

export interface SalesMetrics {
  revenue30d: number;
  revenueAllTime: number;
  orders30d: number;
  avgOrderValue: number;
  unshippedCount: number;
  monthlyRevenue: { month: string; revenue: number }[];
  topItems: { name: string; units: number; revenue: number }[];
  topCountries: { country: string; count: number }[];
}

function parseSaleDate(raw: string): Date {
  const parts = raw.split('/');
  if (parts.length !== 3) return new Date(0);
  const [m, d, y] = parts;
  return new Date(2000 + parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
}

export function useDashboardSalesMetrics(orders: EtsyOrderItem[]): SalesMetrics {
  return useMemo(() => {
    if (orders.length === 0) {
      return {
        revenue30d: 0,
        revenueAllTime: 0,
        orders30d: 0,
        avgOrderValue: 0,
        unshippedCount: 0,
        monthlyRevenue: [],
        topItems: [],
        topCountries: [],
      };
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);

    // All-time revenue (sum itemTotal across all transaction rows)
    const revenueAllTime = orders.reduce((sum, o) => sum + o.itemTotal, 0);

    // Unique order count (each orderId may have multiple item rows)
    const uniqueOrderIds = new Set(orders.map((o) => o.orderId));
    const avgOrderValue = uniqueOrderIds.size > 0 ? revenueAllTime / uniqueOrderIds.size : 0;

    // 30-day metrics
    const recent = orders.filter((o) => parseSaleDate(o.saleDate) >= thirtyDaysAgo);
    const revenue30d = recent.reduce((sum, o) => sum + o.itemTotal, 0);
    const orders30d = new Set(recent.map((o) => o.orderId)).size;

    // Unshipped: unique orderIds where dateShipped is empty
    const unshippedCount = new Set(
      orders.filter((o) => o.dateShipped === '').map((o) => o.orderId)
    ).size;

    // Monthly revenue — last 6 months (always show all 6 buckets, even if $0)
    const monthMap = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthMap.set(key, 0);
    }
    for (const o of orders) {
      const d = parseSaleDate(o.saleDate);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (monthMap.has(key)) {
        monthMap.set(key, (monthMap.get(key) ?? 0) + o.itemTotal);
      }
    }
    const monthlyRevenue = Array.from(monthMap.entries()).map(([month, revenue]) => ({
      month,
      revenue,
    }));

    // Top 5 items by revenue
    const itemMap = new Map<string, { units: number; revenue: number }>();
    for (const o of orders) {
      const prev = itemMap.get(o.itemName) ?? { units: 0, revenue: 0 };
      itemMap.set(o.itemName, {
        units: prev.units + o.quantity,
        revenue: prev.revenue + o.itemTotal,
      });
    }
    const topItems = Array.from(itemMap.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Top 3 countries by transaction count
    const countryMap = new Map<string, number>();
    for (const o of orders) {
      if (!o.shipCountry) continue;
      countryMap.set(o.shipCountry, (countryMap.get(o.shipCountry) ?? 0) + 1);
    }
    const topCountries = Array.from(countryMap.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      revenue30d,
      revenueAllTime,
      orders30d,
      avgOrderValue,
      unshippedCount,
      monthlyRevenue,
      topItems,
      topCountries,
    };
  }, [orders]);
}
```

### Step 2: Verify types

```bash
npx tsc --noEmit
```

Expected: no errors

### Step 3: Commit

```bash
git add src/hooks/useDashboardSalesMetrics.ts
git commit -m "feat(dashboard): add useDashboardSalesMetrics hook"
```

---

## Task 3: Create `AlertsStrip` component

**Files:**
- Create: `src/components/dashboard/AlertsStrip.tsx`

### Step 1: Create the directory and file

`src/components/dashboard/AlertsStrip.tsx`:

```tsx
import { AlertOctagon, AlertTriangle, CheckCircle2, Package, ShoppingBag } from 'lucide-react';
import type { View } from '@/App';

interface AlertsStripProps {
  unshippedCount: number;
  criticalCount: number;
  warningCount: number;
  onNavigate: (view: View) => void;
}

interface AlertCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: 'red' | 'amber';
  onClick: () => void;
}

function AlertCard({ icon, label, value, accent, onClick }: AlertCardProps) {
  const bg =
    accent === 'red'
      ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-950/50'
      : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-950/50';
  const iconCls = accent === 'red' ? 'text-red-500' : 'text-amber-500';
  const valueCls =
    accent === 'red'
      ? 'text-red-700 dark:text-red-400'
      : 'text-amber-700 dark:text-amber-400';

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors cursor-pointer text-left flex-1 min-w-[140px] ${bg}`}
    >
      <span className={`shrink-0 ${iconCls}`}>{icon}</span>
      <div className="min-w-0">
        <div className={`text-xl font-bold tabular-nums ${valueCls}`}>{value}</div>
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{label}</div>
      </div>
    </button>
  );
}

export function AlertsStrip({ unshippedCount, criticalCount, warningCount, onNavigate }: AlertsStripProps) {
  const hasAlerts = unshippedCount > 0 || criticalCount > 0 || warningCount > 0;

  if (!hasAlerts) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          All Clear — no urgent items
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {unshippedCount > 0 && (
        <AlertCard
          icon={<ShoppingBag size={18} />}
          label="Unshipped Orders"
          value={unshippedCount}
          accent="amber"
          onClick={() => onNavigate('orders')}
        />
      )}
      {criticalCount > 0 && (
        <AlertCard
          icon={<AlertOctagon size={18} />}
          label="Critical Inventory"
          value={criticalCount}
          accent="red"
          onClick={() => onNavigate('inventory')}
        />
      )}
      {warningCount > 0 && (
        <AlertCard
          icon={<AlertTriangle size={18} />}
          label="Reorder Warnings"
          value={warningCount}
          accent="amber"
          onClick={() => onNavigate('inventory')}
        />
      )}
    </div>
  );
}
```

### Step 2: Verify types

```bash
npx tsc --noEmit
```

Expected: no errors

### Step 3: Commit

```bash
git add src/components/dashboard/AlertsStrip.tsx
git commit -m "feat(dashboard): add AlertsStrip component"
```

---

## Task 4: Create `PerformanceSection` component

**Files:**
- Create: `src/components/dashboard/PerformanceSection.tsx`

### Step 1: Create the file

`src/components/dashboard/PerformanceSection.tsx`:

```tsx
import { BarChart2, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { KpiCard } from '@/components/kpi/KpiCard';
import type { SalesMetrics } from '@/hooks/useDashboardSalesMetrics';

interface PerformanceSectionProps {
  metrics: SalesMetrics;
  isDark: boolean;
}

function fmtCurrency(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function PerformanceSection({ metrics, isDark }: PerformanceSectionProps) {
  const { revenue30d, revenueAllTime, orders30d, avgOrderValue, monthlyRevenue, topItems } =
    metrics;

  if (revenueAllTime === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/50">
        <BarChart2 size={36} className="mb-3 opacity-40" />
        <p className="text-sm font-medium">No order data yet</p>
        <p className="text-xs mt-1">Upload an Etsy orders CSV on the Orders tab</p>
      </div>
    );
  }

  const gridStroke = isDark ? '#334155' : '#e2e8f0';
  const tickFill = isDark ? '#94a3b8' : '#64748b';
  const tooltipStyle = {
    fontSize: 12,
    borderRadius: 8,
    background: isDark ? '#1e293b' : '#fff',
    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
  };

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="Revenue (30 days)"
          value={`$${fmtCurrency(revenue30d)}`}
          icon={<DollarSign size={20} />}
          accent="green"
        />
        <KpiCard
          label="Revenue (All Time)"
          value={`$${fmtCurrency(revenueAllTime)}`}
          icon={<DollarSign size={20} />}
          accent="blue"
        />
        <KpiCard
          label="Orders (30 days)"
          value={orders30d}
          icon={<ShoppingCart size={20} />}
          accent="blue"
        />
        <KpiCard
          label="Avg Order Value"
          value={`$${avgOrderValue.toFixed(2)}`}
          icon={<TrendingUp size={20} />}
          accent="green"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly revenue bar chart */}
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Monthly Revenue (6 months)
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={monthlyRevenue}
              margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={gridStroke}
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: tickFill }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: tickFill }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Revenue']}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top 5 items */}
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Top Items by Revenue
          </h3>
          {topItems.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500">No item data</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                  <th className="text-left pb-2">Item</th>
                  <th className="text-right pb-2">Units</th>
                  <th className="text-right pb-2">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {topItems.map((item) => (
                  <tr key={item.name}>
                    <td className="py-2 pr-2 text-slate-700 dark:text-slate-300 text-xs truncate max-w-[160px]">
                      {item.name}
                    </td>
                    <td className="py-2 text-right text-slate-500 dark:text-slate-400 tabular-nums text-xs">
                      {item.units}
                    </td>
                    <td className="py-2 text-right font-semibold text-slate-800 dark:text-slate-200 tabular-nums text-xs">
                      ${item.revenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
```

### Step 2: Verify types

```bash
npx tsc --noEmit
```

Expected: no errors

### Step 3: Commit

```bash
git add src/components/dashboard/PerformanceSection.tsx
git commit -m "feat(dashboard): add PerformanceSection component"
```

---

## Task 5: Create `OperationsHealthSection` component

**Files:**
- Create: `src/components/dashboard/OperationsHealthSection.tsx`

### Step 1: Create the file

`src/components/dashboard/OperationsHealthSection.tsx`:

```tsx
import { ArrowRight, MapPin, Package, Printer, Truck } from 'lucide-react';
import type { View } from '@/App';
import type { InventoryMetrics } from '@/hooks/useInventoryMetrics';
import type { SalesMetrics } from '@/hooks/useDashboardSalesMetrics';

interface OperationsHealthSectionProps {
  inventoryMetrics: InventoryMetrics;
  printKpis: { total: number; critical: number; warning: number; totalValue: number };
  salesMetrics: SalesMetrics;
  totalOrders: number;
  onNavigate: (view: View) => void;
}

interface HealthCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  onNavigate?: () => void;
}

function HealthCard({ icon, title, children, onNavigate }: HealthCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-4 flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 dark:text-slate-500">{icon}</span>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
            {title}
          </span>
        </div>
        {onNavigate && (
          <button
            onClick={onNavigate}
            className="text-slate-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowRight size={14} />
          </button>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

function StatusPill({
  count,
  label,
  color,
}: {
  count: number;
  label: string;
  color: 'red' | 'amber' | 'green';
}) {
  const cls =
    color === 'red'
      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
      : color === 'amber'
      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
      : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-lg ${cls}`}>
      {count} {label}
    </span>
  );
}

export function OperationsHealthSection({
  inventoryMetrics,
  printKpis,
  salesMetrics,
  totalOrders,
  onNavigate,
}: OperationsHealthSectionProps) {
  const { criticalCount, warningCount, totalComponents } = inventoryMetrics;
  const { unshippedCount, topCountries } = salesMetrics;

  const shippedCount = totalOrders - unshippedCount;
  const shipPct = totalOrders > 0 ? (shippedCount / totalOrders) * 100 : 0;
  const invHealthy = totalComponents - criticalCount - warningCount;
  const printHealthy = printKpis.total - printKpis.critical - printKpis.warning;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
      {/* Fulfillment */}
      <HealthCard
        icon={<Truck size={15} />}
        title="Fulfillment"
        onNavigate={() => onNavigate('orders')}
      >
        {totalOrders === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500">No orders loaded</p>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                {shippedCount} / {totalOrders} shipped
              </span>
              <span
                className={`font-semibold tabular-nums ${
                  unshippedCount > 5
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {shipPct.toFixed(0)}%
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  unshippedCount > 5 ? 'bg-red-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${shipPct}%` }}
              />
            </div>
            {unshippedCount > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 font-medium">
                {unshippedCount} unshipped
              </p>
            )}
          </>
        )}
      </HealthCard>

      {/* Component inventory */}
      <HealthCard
        icon={<Package size={15} />}
        title="Components"
        onNavigate={() => onNavigate('dashboard')}
      >
        <div className="flex flex-wrap gap-1.5">
          <StatusPill count={invHealthy} label="OK" color="green" />
          {warningCount > 0 && <StatusPill count={warningCount} label="warning" color="amber" />}
          {criticalCount > 0 && <StatusPill count={criticalCount} label="critical" color="red" />}
        </div>
      </HealthCard>

      {/* Print inventory */}
      <HealthCard
        icon={<Printer size={15} />}
        title="Print Inventory"
        onNavigate={() => onNavigate('inventory')}
      >
        <div className="flex flex-wrap gap-1.5">
          <StatusPill count={printHealthy} label="OK" color="green" />
          {printKpis.warning > 0 && (
            <StatusPill count={printKpis.warning} label="warning" color="amber" />
          )}
          {printKpis.critical > 0 && (
            <StatusPill count={printKpis.critical} label="critical" color="red" />
          )}
        </div>
      </HealthCard>

      {/* Top markets */}
      <HealthCard
        icon={<MapPin size={15} />}
        title="Top Markets"
        onNavigate={() => onNavigate('salesmap')}
      >
        {topCountries.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500">No orders loaded</p>
        ) : (
          <div className="space-y-1.5">
            {topCountries.map((c, i) => (
              <div key={c.country} className="flex items-center justify-between text-xs">
                <span
                  className={
                    i === 0
                      ? 'font-semibold text-slate-700 dark:text-slate-200 truncate'
                      : 'text-slate-500 dark:text-slate-400 truncate'
                  }
                >
                  {c.country}
                </span>
                <span className="tabular-nums text-slate-500 dark:text-slate-400 ml-2 shrink-0">
                  {c.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </HealthCard>
    </div>
  );
}
```

### Step 2: Verify types

```bash
npx tsc --noEmit
```

Expected: no errors

### Step 3: Commit

```bash
git add src/components/dashboard/OperationsHealthSection.tsx
git commit -m "feat(dashboard): add OperationsHealthSection component"
```

---

## Task 6: Wire everything into `Dashboard.tsx`

**Files:**
- Modify: `src/pages/Dashboard.tsx`

This is the final wiring step. Replace the `activeView === 'dashboard'` block with the three new sections.

### Step 1: Add all new imports to Dashboard.tsx

At the top of `src/pages/Dashboard.tsx`, add these imports alongside the existing ones:

```typescript
import { usePrintInventory } from '@/hooks/usePrintInventory';
import { useDashboardSalesMetrics } from '@/hooks/useDashboardSalesMetrics';
import { AlertsStrip } from '@/components/dashboard/AlertsStrip';
import { PerformanceSection } from '@/components/dashboard/PerformanceSection';
import { OperationsHealthSection } from '@/components/dashboard/OperationsHealthSection';
```

### Step 2: Call the new hooks inside the `Dashboard` function

After `const { enrichedComponents } = metrics;`, add:

```typescript
const { kpis: printKpis } = usePrintInventory();
const salesMetrics = useDashboardSalesMetrics(salesOrders);
const totalUniqueOrders = new Set(salesOrders.map((o) => o.orderId)).size;
const combinedCritical = metrics.criticalCount + printKpis.critical;
const combinedWarning = metrics.warningCount + printKpis.warning;
```

### Step 3: Replace the `activeView === 'dashboard'` block

Replace the entire block from `{activeView === 'dashboard' && (` through its closing `)}` with:

```tsx
{activeView === 'dashboard' && (
  <>
    <PageSection title="Alerts">
      <AlertsStrip
        unshippedCount={salesMetrics.unshippedCount}
        criticalCount={combinedCritical}
        warningCount={combinedWarning}
        onNavigate={onNavigate}
      />
    </PageSection>

    <PageSection title="Performance">
      <PerformanceSection metrics={salesMetrics} isDark={isDark} />
    </PageSection>

    <PageSection title="Operations">
      <OperationsHealthSection
        inventoryMetrics={metrics}
        printKpis={printKpis}
        salesMetrics={salesMetrics}
        totalOrders={totalUniqueOrders}
        onNavigate={onNavigate}
      />
    </PageSection>
  </>
)}
```

### Step 4: Verify types

```bash
npx tsc --noEmit
```

Expected: no errors

### Step 5: Start the dev server and verify visually

```bash
npm run dev
```

Check:
- Dashboard shows three sections: Alerts, Performance, Operations
- "All Clear" appears when no critical/warning items
- Performance section shows empty state prompt when no orders loaded
- After uploading an orders CSV, revenue KPIs and charts populate
- Alert cards navigate to the correct tab when clicked
- Dark mode looks correct

### Step 6: Commit

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat(dashboard): wire business overview into dashboard view"
```

---

## Done

The dashboard now shows:
- **Alerts** — urgent items front-and-center, clickable to deep-link
- **Performance** — revenue KPIs + monthly bar chart + top items table
- **Operations** — health scorecards for fulfillment, components, print inventory, and top markets
