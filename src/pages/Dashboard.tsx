import { useState } from 'react';
import { useInventoryMetrics } from '@/hooks/useInventoryMetrics';
import { consumptionRecords } from '@/data';

import { KpiCardGrid } from '@/components/kpi/KpiCardGrid';
import { ReorderAlertsPanel } from '@/components/alerts/ReorderAlertsPanel';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { OrdersView } from '@/components/orders/OrdersView';
import { ConsumptionTrendChart } from '@/components/charts/ConsumptionTrendChart';
import { InventoryLevelChart } from '@/components/charts/InventoryLevelChart';
import { ChartComponentSelector } from '@/components/charts/ChartComponentSelector';
import { PageSection } from '@/components/layout/PageSection';

type View = 'dashboard' | 'inventory' | 'orders' | 'charts';

interface DashboardProps {
  activeView: View;
}

export function Dashboard({ activeView }: DashboardProps) {
  const metrics = useInventoryMetrics();
  const { enrichedComponents } = metrics;
  const [selectedChartCompId, setSelectedChartCompId] = useState(enrichedComponents[0]?.id ?? '');

  const selectedComp = enrichedComponents.find((c) => c.id === selectedChartCompId);

  return (
    <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
      {activeView === 'dashboard' && (
        <>
          <PageSection title="Key Performance Indicators">
            <KpiCardGrid metrics={metrics} />
          </PageSection>
          <PageSection title="Reorder Alerts">
            <ReorderAlertsPanel components={enrichedComponents} />
          </PageSection>
          <PageSection title="Inventory Overview">
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
        <PageSection title="Purchase Orders">
          <OrdersView />
        </PageSection>
      )}

      {activeView === 'charts' && (
        <>
          <PageSection title="Consumption Trend">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-slate-400 text-sm">Component:</span>
              <ChartComponentSelector
                components={enrichedComponents}
                selectedId={selectedChartCompId}
                onChange={setSelectedChartCompId}
              />
            </div>
            {selectedComp && (
              <ConsumptionTrendChart
                componentId={selectedComp.id}
                componentName={selectedComp.name}
                records={consumptionRecords}
                avgDaily={selectedComp.avgDailyConsumption}
              />
            )}
          </PageSection>
          <PageSection title="Inventory Level Analysis">
            <InventoryLevelChart components={enrichedComponents} />
          </PageSection>
        </>
      )}
    </main>
  );
}
