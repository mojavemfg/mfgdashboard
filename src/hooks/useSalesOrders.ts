import { useState, useCallback } from 'react';
import type { SaleRecord } from '@/types';

const STORAGE_KEY = 'salesmap_orders';

function load(): SaleRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SaleRecord[];
  } catch {
    return [];
  }
}

function save(records: SaleRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export interface MergeResult {
  added: number;
  duplicates: number;
}

export function useSalesOrders() {
  const [orders, setOrders] = useState<SaleRecord[]>(() => load());

  const merge = useCallback((incoming: SaleRecord[]): MergeResult => {
    const existing = load();
    const existingIds = new Set(existing.map((r) => r.orderId));
    const newRecords = incoming.filter((r) => !existingIds.has(r.orderId));
    const merged = [...existing, ...newRecords];
    save(merged);
    setOrders(merged);
    return { added: newRecords.length, duplicates: incoming.length - newRecords.length };
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setOrders([]);
  }, []);

  return { orders, merge, clear };
}
