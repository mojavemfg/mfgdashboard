import type { EtsyOrderItem, SaleRecord } from '@/types';
import { STATE_ABBR_TO_NAME } from './geoLookup';

/**
 * Converts item-level EtsyOrderItem[] into order-level SaleRecord[]
 * by grouping on orderId. Revenue = sum of itemTotals per order.
 */
export function toSaleRecords(items: EtsyOrderItem[]): SaleRecord[] {
  const map = new Map<string, SaleRecord>();
  for (const item of items) {
    const existing = map.get(item.orderId);
    if (existing) {
      existing.orderValue += item.itemTotal;
      existing.numItems += item.quantity;
    } else {
      map.set(item.orderId, {
        orderId: item.orderId,
        saleDate: item.saleDate,
        fullName: item.shipName,
        shipCity: item.shipCity,
        shipState: item.shipState,
        shipCountry: item.shipCountry,
        orderValue: item.itemTotal,
        numItems: item.quantity,
      });
    }
  }
  return [...map.values()];
}

export interface RegionStat {
  key: string;     // state abbreviation or raw CSV country name
  label: string;   // display-friendly name
  count: number;
  revenue: number;
}

export function statsByUsState(orders: SaleRecord[]): RegionStat[] {
  const map = new Map<string, RegionStat>();
  for (const o of orders) {
    if (o.shipCountry !== 'United States') continue;
    const abbr = o.shipState.toUpperCase();
    if (!abbr) continue;
    const existing = map.get(abbr);
    if (existing) {
      existing.count++;
      existing.revenue += o.orderValue;
    } else {
      map.set(abbr, {
        key: abbr,
        label: STATE_ABBR_TO_NAME[abbr] ?? abbr,
        count: 1,
        revenue: o.orderValue,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export function statsByCountry(orders: SaleRecord[]): RegionStat[] {
  const map = new Map<string, RegionStat>();
  for (const o of orders) {
    const key = o.shipCountry.trim();
    if (!key) continue;
    const existing = map.get(key);
    if (existing) {
      existing.count++;
      existing.revenue += o.orderValue;
    } else {
      map.set(key, { key, label: key, count: 1, revenue: o.orderValue });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}
