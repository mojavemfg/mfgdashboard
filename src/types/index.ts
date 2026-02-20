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

export interface SaleRecord {
  orderId: string;
  saleDate: string;
  fullName: string;
  shipCity: string;
  shipState: string;    // 2-letter code for US; may be empty for international
  shipCountry: string;  // full country name as in the CSV
  orderValue: number;
  numItems: number;
}

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

// ─── Etsy Listing Analysis ─────────────────────────────────────────────────

export interface EtsyListing {
  title: string;
  description: string;
  price: number;
  quantity: number;
  tags: string[];          // already split on comma, trimmed
  materials: string;
  images: string[];        // only non-empty image URLs
  sku: string;
}

export interface ListingSubScores {
  tags: number;     // 0–100
  title: number;    // 0–100
  images: number;   // 0–100
  description: number; // 0–100
  price: number;    // 0–100
}

export interface ScoredListing extends EtsyListing {
  index: number;              // original row position
  overall: number;            // weighted 0–100
  subScores: ListingSubScores;
  aiTags: string[] | null;    // null = not yet fetched; [] = fetch attempted, no result
  aiStatus: 'pending' | 'loading' | 'done' | 'error';
  aiError?: string;
}
