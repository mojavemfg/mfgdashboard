import { useInventoryMetrics } from '@/hooks/useInventoryMetrics';
import type { View } from '@/App';
import type { EtsyOrderItem } from '@/types';
import type { MergeResult } from '@/hooks/useSalesOrders';

import { KpiCardGrid } from '@/components/kpi/KpiCardGrid';
import { ReorderAlertsPanel } from '@/components/alerts/ReorderAlertsPanel';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { PrintInventoryView } from '@/components/inventory/PrintInventoryView';
import { OrderHistoryView } from '@/components/orders/OrderHistoryView';
import { PageSection } from '@/components/layout/PageSection';
import { EtsySeoTool } from '@/components/seo/EtsySeoTool';
import { SalesMapView } from '@/components/salesmap/SalesMapView';
import { MarginCalculatorView } from '@/components/margin/MarginCalculatorView';
import { ListingsView } from '@/components/listings/ListingsView';

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
          <PageSection title="Print Inventory">
            <PrintInventoryView />
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

        {activeView === 'listings' && (
          <ListingsView />
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
