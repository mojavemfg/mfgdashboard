import { useState, useCallback, useMemo } from 'react';
import type { PrintItem, PrintItemWithStatus, PrintStatus } from '@/types/printInventory';
import { printInventorySeed } from '@/data/printInventory';

const STORAGE_KEY = 'mfg-print-inventory';

function deriveStatus(item: PrintItem, critMulti: number, warnMulti: number): PrintStatus {
  if (item.currentStock < item.safetyStock * critMulti) return 'Critical';
  if (item.currentStock < item.safetyStock * warnMulti) return 'Warning';
  return 'OK';
}

function load(): PrintItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PrintItem[];
  } catch {
    // corrupted — fall through to seed
  }
  return printInventorySeed;
}

function save(items: PrintItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    console.warn('[usePrintInventory] localStorage write failed - data not persisted');
  }
}

export function usePrintInventory(criticalMultiplier = 1.0, warningMultiplier = 1.5) {
  const [items, setItems] = useState<PrintItem[]>(load);

  const enriched = useMemo<PrintItemWithStatus[]>(() =>
    items.map((item) => ({
      ...item,
      status: deriveStatus(item, criticalMultiplier, warningMultiplier),
      totalValue: item.currentStock * (item.unitCost ?? 0),
    })), [items, criticalMultiplier, warningMultiplier]);

  const upsert = useCallback((item: PrintItem) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      const next = exists
        ? prev.map((i) => (i.id === item.id ? item : i))
        : [...prev, item];
      save(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      save(next);
      return next;
    });
  }, []);

  const kpis = useMemo(() => {
    const critical = enriched.filter((i) => i.status === 'Critical').length;
    const warning = enriched.filter((i) => i.status === 'Warning').length;
    const totalValue = enriched.reduce((sum, i) => sum + i.totalValue, 0);
    return { total: enriched.length, critical, warning, totalValue };
  }, [enriched]);

  return { enriched, upsert, remove, kpis };
}
