export type ComponentCategory =
  | 'Passive'
  | 'Semiconductor'
  | 'PCB'
  | 'Display'
  | 'Mechanical'
  | 'Connector'
  | 'Cable'
  | 'Fastener';

export type ReorderStatus = 'Critical' | 'Warning' | 'OK';

export type OrderStatus = 'Delivered' | 'Pending' | 'Cancelled';

export interface SubComponent {
  id: string;
  name: string;
  sku: string;
  category: ComponentCategory;
  unit: string;
  currentStock: number;
  unitCost: number;
  supplier: string;
  leadTimeDays: number;
  safetyStock: number;
  reorderQty: number;
}

export interface ConsumptionRecord {
  componentId: string;
  date: string; // ISO date string YYYY-MM-DD
  unitsConsumed: number;
}

export interface PurchaseOrder {
  id: string;
  componentId: string;
  date: string; // ISO date string
  deliveredDate: string; // ISO date string
  supplier: string;
  quantityOrdered: number;
  unitCostAtOrder: number;
  totalCost: number;
  status: OrderStatus;
}

export interface ComponentWithMetrics extends SubComponent {
  avgDailyConsumption: number;
  daysOfStockRemaining: number;
  reorderPoint: number;
  daysUntilReorder: number;
  predictedReorderDate: string;
  status: ReorderStatus;
  totalInventoryValue: number;
}
