import { useState, useCallback } from 'react';
import type { EtsyOrderItem } from '@/types';

const STORAGE_KEY = 'salesmap_orders';

function load(): EtsyOrderItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as EtsyOrderItem[];
  } catch {
    return [];
  }
}

function save(records: EtsyOrderItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export interface MergeResult {
  added: number;
  duplicates: number;
}

export function useSalesOrders() {
  const [orders, setOrders] = useState<EtsyOrderItem[]>(() => load());

  const merge = useCallback((incoming: EtsyOrderItem[]): MergeResult => {
    const existing = load();
    const existingIds = new Set(existing.map((r) => r.transactionId));
    const newRecords = incoming.filter((r) => !existingIds.has(r.transactionId));
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
