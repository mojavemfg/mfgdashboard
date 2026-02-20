export type PrintCategory = 'Filament' | 'Insert' | 'Spare Part';
export type PrintStatus = 'Critical' | 'Warning' | 'OK';

export interface PrintItem {
  id: string;
  name: string;
  category: PrintCategory;
  unit: string;
  currentStock: number;
  safetyStock: number;
  reorderQty: number;
  leadTimeDays: number;
  supplier?: string;
  unitCost?: number;
  // Filament-specific
  material?: string;
  color?: string;
  // Insert-specific
  insertSize?: string;
  insertType?: string;
}

export interface PrintItemWithStatus extends PrintItem {
  status: PrintStatus;
  totalValue: number;
}
