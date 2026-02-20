import { useState, useCallback } from 'react';
import { Calculator, Plus, X, Pencil, Check, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FilamentPreset {
  id: string;
  name: string;
  costPerKg: number;
}

export interface HardwareItem {
  id: string;
  name: string;
  cost: number;
}

export interface ProductPreset {
  id: string;
  name: string;
  filamentId: string;
  filamentGrams: number;
  printHours: number;
  printerWatts: number;
  kwHRate: number;
  packagingCost: number;
  hardwareItems: HardwareItem[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const LISTING_FEE = 0.20;
export const TRANSACTION_RATE = 0.065;
export const PROCESSING_RATE = 0.03;
export const PROCESSING_FIXED = 0.25;

export const DEFAULT_FILAMENTS: FilamentPreset[] = [
  { id: 'pla',   name: 'PLA',   costPerKg: 22 },
  { id: 'petg',  name: 'PETG',  costPerKg: 26 },
  { id: 'asa',   name: 'ASA',   costPerKg: 28 },
  { id: 'abs',   name: 'ABS',   costPerKg: 24 },
  { id: 'tpu',   name: 'TPU',   costPerKg: 35 },
  { id: 'resin', name: 'Resin', costPerKg: 40 },
];

export const CHART_COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444'];

export const LS_FILAMENTS = 'margin_filament_library';
export const LS_PRESETS   = 'margin_presets';

// ─── localStorage helpers ─────────────────────────────────────────────────────

export function loadFilaments(): FilamentPreset[] {
  try {
    const raw = localStorage.getItem(LS_FILAMENTS);
    if (raw) return JSON.parse(raw) as FilamentPreset[];
  } catch { /* ignore */ }
  return DEFAULT_FILAMENTS;
}

export function saveFilaments(list: FilamentPreset[]) {
  try {
    localStorage.setItem(LS_FILAMENTS, JSON.stringify(list));
  } catch { /* ignore QuotaExceededError */ }
}

export function loadPresets(): ProductPreset[] {
  try {
    const raw = localStorage.getItem(LS_PRESETS);
    if (raw) return JSON.parse(raw) as ProductPreset[];
  } catch { /* ignore */ }
  return [];
}

export function savePresets(list: ProductPreset[]) {
  try {
    localStorage.setItem(LS_PRESETS, JSON.stringify(list));
  } catch { /* ignore QuotaExceededError */ }
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

// ─── Calculations ─────────────────────────────────────────────────────────────

export function calcCosts(
  filaments: FilamentPreset[],
  state: {
    filamentId: string;
    filamentGrams: number;
    printHours: number;
    printerWatts: number;
    kwHRate: number;
    packagingCost: number;
    hardwareItems: HardwareItem[];
  }
) {
  const fil = filaments.find((f) => f.id === state.filamentId);
  const filamentCost = fil ? (state.filamentGrams / 1000) * fil.costPerKg : 0;
  const electricityCost = state.printHours * (state.printerWatts / 1000) * state.kwHRate;
  const hardwareCost = state.hardwareItems.reduce((s, h) => s + h.cost, 0);
  const baseCost = filamentCost + electricityCost + state.packagingCost + hardwareCost + LISTING_FEE;
  return { filamentCost, electricityCost, hardwareCost, baseCost };
}

export function marginFromPrice(baseCost: number, salePrice: number) {
  if (salePrice <= 0) return 0;
  const fees = salePrice * TRANSACTION_RATE + salePrice * PROCESSING_RATE + PROCESSING_FIXED;
  const profit = salePrice - baseCost - fees;
  return profit / salePrice;
}

export function priceFromMargin(baseCost: number, targetMargin: number) {
  const denom = 1 - TRANSACTION_RATE - PROCESSING_RATE - targetMargin;
  if (denom <= 0) return 0;
  return (baseCost + PROCESSING_FIXED) / denom;
}

// ─── Main Component ───────────────────────────────────────────────────────────

const BLANK_STATE = {
  filamentId: 'pla',
  filamentGrams: 100,
  printHours: 4,
  printerWatts: 250,
  kwHRate: 0.13,
  packagingCost: 0.75,
  hardwareItems: [] as HardwareItem[],
};

export function MarginCalculatorView() {
  const [filaments, setFilaments] = useState<FilamentPreset[]>(loadFilaments);
  const [presets, setPresets] = useState<ProductPreset[]>(loadPresets);

  // Working state
  const [filamentId, setFilamentId] = useState(BLANK_STATE.filamentId);
  const [filamentGrams, setFilamentGrams] = useState(BLANK_STATE.filamentGrams);
  const [printHours, setPrintHours] = useState(BLANK_STATE.printHours);
  const [printerWatts, setPrinterWatts] = useState(BLANK_STATE.printerWatts);
  const [kwHRate, setKwHRate] = useState(BLANK_STATE.kwHRate);
  const [packagingCost, setPackagingCost] = useState(BLANK_STATE.packagingCost);
  const [hardwareItems, setHardwareItems] = useState<HardwareItem[]>([]);

  // Results state
  const [salePrice, setSalePrice] = useState<number>(0);
  const [targetMargin, setTargetMargin] = useState<number>(30);
  const [lastEdited, setLastEdited] = useState<'price' | 'margin'>('margin');

  // UI state
  const [showLibrary, setShowLibrary] = useState(false);
  const [saveNameDraft, setSaveNameDraft] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  const currentState = { filamentId, filamentGrams, printHours, printerWatts, kwHRate, packagingCost, hardwareItems };
  const { filamentCost, electricityCost, hardwareCost, baseCost } = calcCosts(filaments, currentState);

  // Two-way sync: when baseCost changes, recompute the non-user-edited field
  const displayMargin = marginFromPrice(baseCost, salePrice) * 100;
  const displayPrice = priceFromMargin(baseCost, targetMargin / 100);

  function handlePriceChange(val: number) {
    setSalePrice(val);
    setLastEdited('price');
    setTargetMargin(Math.round(marginFromPrice(baseCost, val) * 1000) / 10);
  }

  function handleMarginChange(val: number) {
    setTargetMargin(val);
    setLastEdited('margin');
    setSalePrice(Math.round(priceFromMargin(baseCost, val / 100) * 100) / 100);
  }

  function loadPreset(id: string) {
    const p = presets.find((x) => x.id === id);
    if (!p) return;
    setFilamentId(p.filamentId);
    setFilamentGrams(p.filamentGrams);
    setPrintHours(p.printHours);
    setPrinterWatts(p.printerWatts);
    setKwHRate(p.kwHRate);
    setPackagingCost(p.packagingCost);
    setHardwareItems(p.hardwareItems);
  }

  function savePreset() {
    const name = saveNameDraft.trim();
    if (!name) return;
    const newPreset: ProductPreset = { id: uid(), name, ...currentState };
    const updated = [...presets, newPreset];
    setPresets(updated);
    savePresets(updated);
    setSaveNameDraft('');
    setShowSaveInput(false);
  }

  function deletePreset(id: string) {
    const updated = presets.filter((p) => p.id !== id);
    setPresets(updated);
    savePresets(updated);
  }

  function resetState() {
    setFilamentId(BLANK_STATE.filamentId);
    setFilamentGrams(BLANK_STATE.filamentGrams);
    setPrintHours(BLANK_STATE.printHours);
    setPrinterWatts(BLANK_STATE.printerWatts);
    setKwHRate(BLANK_STATE.kwHRate);
    setPackagingCost(BLANK_STATE.packagingCost);
    setHardwareItems([]);
  }

  // Filament library edit helpers
  const updateFilament = useCallback((id: string, field: 'name' | 'costPerKg', value: string | number) => {
    setFilaments((prev) => {
      const updated = prev.map((f) => f.id === id ? { ...f, [field]: value } : f);
      saveFilaments(updated);
      return updated;
    });
  }, []);

  const addFilament = useCallback(() => {
    setFilaments((prev) => {
      const newF: FilamentPreset = { id: uid(), name: 'New', costPerKg: 25 };
      const updated = [...prev, newF];
      saveFilaments(updated);
      return updated;
    });
  }, []);

  const removeFilament = useCallback((id: string) => {
    setFilaments((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      saveFilaments(updated);
      return updated;
    });
  }, []);

  // JSX comes in Task 4
  void showLibrary; void setShowLibrary; void saveNameDraft; void setSaveNameDraft;
  void showSaveInput; void setShowSaveInput; void filamentCost; void electricityCost;
  void hardwareCost; void displayMargin; void displayPrice;
  void lastEdited; void handlePriceChange; void handleMarginChange; void loadPreset; void savePreset; void deletePreset; void resetState;
  void updateFilament; void addFilament; void removeFilament;
  void Calculator; void Plus; void X; void Pencil; void Check; void Trash2;
  void PieChart; void Pie; void Cell; void Tooltip; void ResponsiveContainer; void Legend;
  return <div className="max-w-2xl mx-auto"><p className="text-slate-500 dark:text-slate-400 text-sm">Wiring state…</p></div>;
}
