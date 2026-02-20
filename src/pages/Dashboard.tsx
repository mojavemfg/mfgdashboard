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
