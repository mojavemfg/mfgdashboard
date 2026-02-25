import type { SubComponent, ConsumptionRecord, ComponentWithMetrics, ReorderStatus } from '@/types';

function todayStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const TODAY = todayStr();

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDate(dateStr: string): string {
  return dateStr;
}

export function computeAvgDailyConsumption(
  componentId: string,
  records: ConsumptionRecord[],
  today: string = TODAY,
): number {
  const thirtyDaysAgo = addDays(today, -30);
  const relevant = records.filter(
    (r) => r.componentId === componentId && r.date > thirtyDaysAgo && r.date <= today,
  );
  if (relevant.length === 0) return 0;
  const total = relevant.reduce((sum, r) => sum + r.unitsConsumed, 0);
  return total / 30;
}

export function computeReorderPoint(avgDaily: number, leadTimeDays: number, safetyStock: number): number {
  return avgDaily * leadTimeDays + safetyStock;
}

export function computeDaysUntilReorder(
  currentStock: number,
  reorderPoint: number,
  avgDaily: number,
): number {
  if (avgDaily === 0) return Infinity;
  return (currentStock - reorderPoint) / avgDaily;
}

export function computeDaysOfStockRemaining(currentStock: number, avgDaily: number): number {
  if (avgDaily === 0) return Infinity;
  return currentStock / avgDaily;
}

export function computeStatus(daysUntilReorder: number): ReorderStatus {
  if (daysUntilReorder === Infinity) return 'OK';
  if (daysUntilReorder <= 3) return 'Critical';
  if (daysUntilReorder <= 7) return 'Warning';
  return 'OK';
}

export function computePredictedReorderDate(daysUntilReorder: number, today: string = TODAY): string {
  if (daysUntilReorder === Infinity) return '—';
  const clampedDays = Math.max(0, Math.floor(daysUntilReorder));
  return formatDate(addDays(today, clampedDays));
}

export function enrichComponents(
  components: SubComponent[],
  records: ConsumptionRecord[],
  today: string = TODAY,
): ComponentWithMetrics[] {
  return components.map((comp) => {
    const avgDailyConsumption = computeAvgDailyConsumption(comp.id, records, today);
    const reorderPoint = computeReorderPoint(avgDailyConsumption, comp.leadTimeDays, comp.safetyStock);
    const daysUntilReorder = computeDaysUntilReorder(comp.currentStock, reorderPoint, avgDailyConsumption);
    const daysOfStockRemaining = computeDaysOfStockRemaining(comp.currentStock, avgDailyConsumption);
    const status = computeStatus(daysUntilReorder);
    const predictedReorderDate = computePredictedReorderDate(daysUntilReorder, today);
    const totalInventoryValue = comp.currentStock * comp.unitCost;

    return {
      ...comp,
      avgDailyConsumption,
      daysOfStockRemaining,
      reorderPoint,
      daysUntilReorder,
      predictedReorderDate,
      status,
      totalInventoryValue,
    };
  });
}
