import { useInventoryMetrics } from '@/hooks/useInventoryMetrics';
import { useDashboardSalesMetrics } from '@/hooks/useDashboardSalesMetrics';
import type { View } from '@/App';
import type { EtsyOrderItem } from '@/types';
import type { MergeResult } from '@/hooks/useSalesOrders';
import type { PrintItemWithStatus, PrintItem } from '@/types/printInventory';
import type { AppSettings, SettingsUpdate } from '@/hooks/useSettings';

import { PrintInventoryView } from '@/components/inventory/PrintInventoryView';
import { OrderHistoryView } from '@/components/orders/OrderHistoryView';
import { PageSection } from '@/components/layout/PageSection';
import { EtsySeoTool } from '@/components/seo/EtsySeoTool';
import { SalesMapView } from '@/components/salesmap/SalesMapView';
import { MarginCalculatorView } from '@/components/margin/MarginCalculatorView';
import { SettingsView } from '@/components/settings/SettingsView';
import { ListingsView } from '@/components/listings/ListingsView';
import { AlertsStrip } from '@/components/dashboard/AlertsStrip';
import { PerformanceSection } from '@/components/dashboard/PerformanceSection';
import { OperationsHealthSection } from '@/components/dashboard/OperationsHealthSection';

interface DashboardProps {
  activeView: View;
  isDark: boolean;
  salesOrders: EtsyOrderItem[];
  onMergeSalesOrders: (records: EtsyOrderItem[]) => MergeResult;
  onClearSalesOrders: () => void;
  onNavigate: (view: View) => void;
  printKpis: { total: number; critical: number; warning: number; totalValue: number };
  printEnriched: PrintItemWithStatus[];
  onUpsertPrintItem: (item: PrintItem) => void;
  onRemovePrintItem: (id: string) => void;
  onThemeToggle: () => void;
  settings: AppSettings;
  updateSettings: (p: SettingsUpdate) => void;
}

export function Dashboard({
  activeView, isDark, salesOrders, onMergeSalesOrders, onClearSalesOrders,
  onNavigate, printKpis, printEnriched, onUpsertPrintItem, onRemovePrintItem,
  onThemeToggle, settings, updateSettings,
}: DashboardProps) {
  const metrics = useInventoryMetrics();
  const salesMetrics = useDashboardSalesMetrics(salesOrders);
  const totalUniqueOrders = new Set(salesOrders.map((o) => o.orderId)).size;
  const combinedCritical  = metrics.criticalCount + printKpis.critical;
  const combinedWarning   = metrics.warningCount + printKpis.warning;

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--color-bg-subtle)]">
      <div className="px-4 lg:px-6 pt-6 pb-24 lg:pb-8 max-w-[1440px]">
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

        {activeView === 'inventory' && (
          <PrintInventoryView
            enriched={printEnriched}
            upsert={onUpsertPrintItem}
            remove={onRemovePrintItem}
            kpis={printKpis}
          />
        )}

        {activeView === 'orders' && (
          <OrderHistoryView
            orders={salesOrders}
            onMerge={onMergeSalesOrders}
            onClear={onClearSalesOrders}
          />
        )}

        {activeView === 'listings' && <ListingsView />}

        {activeView === 'seo' && <EtsySeoTool />}

        {activeView === 'salesmap' && (
          <SalesMapView
            isDark={isDark}
            orders={salesOrders}
            onMerge={onMergeSalesOrders}
            onClear={onClearSalesOrders}
          />
        )}

        {activeView === 'margin' && <MarginCalculatorView settings={settings} />}

        {activeView === 'settings' && (
          <SettingsView
            settings={settings}
            update={updateSettings}
            isDark={isDark}
            onThemeToggle={onThemeToggle}
          />
        )}
      </div>
    </main>
  );
}
