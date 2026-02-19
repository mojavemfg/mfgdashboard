import { useMemo } from 'react';
import { components, consumptionRecords } from '@/data';
import { enrichComponents } from '@/lib/reorderEngine';
import type { ComponentWithMetrics } from '@/types';

export interface InventoryMetrics {
  enrichedComponents: ComponentWithMetrics[];
  totalComponents: number;
  criticalCount: number;
  warningCount: number;
  needsReorderCount: number;
  totalInventoryValue: number;
}

export function useInventoryMetrics(): InventoryMetrics {
  return useMemo(() => {
    const enrichedComponents = enrichComponents(components, consumptionRecords);

    const criticalCount = enrichedComponents.filter((c) => c.status === 'Critical').length;
    const warningCount = enrichedComponents.filter((c) => c.status === 'Warning').length;
    const needsReorderCount = criticalCount + warningCount;
    const totalInventoryValue = enrichedComponents.reduce((sum, c) => sum + c.totalInventoryValue, 0);

    return {
      enrichedComponents,
      totalComponents: enrichedComponents.length,
      criticalCount,
      warningCount,
      needsReorderCount,
      totalInventoryValue,
    };
  }, []);
}
