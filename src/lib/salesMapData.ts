import type { SaleRecord } from '@/types';
import { STATE_ABBR_TO_NAME } from './geoLookup';

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
