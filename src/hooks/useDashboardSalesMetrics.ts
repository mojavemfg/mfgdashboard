import { useMemo } from 'react';
import type { EtsyOrderItem } from '@/types';

export interface SalesMetrics {
  revenue30d: number;
  revenueAllTime: number;
  orders30d: number;
  avgOrderValue: number;
  unshippedCount: number;
  monthlyRevenue: { month: string; revenue: number }[];
  topItems: { name: string; units: number; revenue: number }[];
  topCountries: { country: string; count: number }[];
}

function parseSaleDate(raw: string): Date {
  const parts = raw.split('/');
  if (parts.length !== 3) return new Date(0);
  const [m, d, y] = parts;
  return new Date(2000 + parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
}

export function useDashboardSalesMetrics(orders: EtsyOrderItem[]): SalesMetrics {
  return useMemo(() => {
    if (orders.length === 0) {
      return {
        revenue30d: 0,
        revenueAllTime: 0,
        orders30d: 0,
        avgOrderValue: 0,
        unshippedCount: 0,
        monthlyRevenue: [],
        topItems: [],
        topCountries: [],
      };
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);

    const revenueAllTime = orders.reduce((sum, o) => sum + o.itemTotal, 0);

    const uniqueOrderIds = new Set(orders.map((o) => o.orderId));
    const avgOrderValue = uniqueOrderIds.size > 0 ? revenueAllTime / uniqueOrderIds.size : 0;

    const recent = orders.filter((o) => parseSaleDate(o.saleDate) >= thirtyDaysAgo);
    const revenue30d = recent.reduce((sum, o) => sum + o.itemTotal, 0);
    const orders30d = new Set(recent.map((o) => o.orderId)).size;

    const unshippedCount = new Set(
      orders.filter((o) => o.dateShipped === '').map((o) => o.orderId)
    ).size;

    const monthMap = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthMap.set(key, 0);
    }
    for (const o of orders) {
      const d = parseSaleDate(o.saleDate);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (monthMap.has(key)) {
        monthMap.set(key, (monthMap.get(key) ?? 0) + o.itemTotal);
      }
    }
    const monthlyRevenue = Array.from(monthMap.entries()).map(([month, revenue]) => ({
      month,
      revenue,
    }));

    const itemMap = new Map<string, { units: number; revenue: number }>();
    for (const o of orders) {
      const prev = itemMap.get(o.itemName) ?? { units: 0, revenue: 0 };
      itemMap.set(o.itemName, {
        units: prev.units + o.quantity,
        revenue: prev.revenue + o.itemTotal,
      });
    }
    const topItems = Array.from(itemMap.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const countryMap = new Map<string, number>();
    for (const o of orders) {
      if (!o.shipCountry) continue;
      countryMap.set(o.shipCountry, (countryMap.get(o.shipCountry) ?? 0) + 1);
    }
    const topCountries = Array.from(countryMap.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      revenue30d,
      revenueAllTime,
      orders30d,
      avgOrderValue,
      unshippedCount,
      monthlyRevenue,
      topItems,
      topCountries,
    };
  }, [orders]);
}
