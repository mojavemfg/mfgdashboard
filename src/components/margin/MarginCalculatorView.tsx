import { useState, useCallback } from 'react';
import { Calculator, Plus, X, Pencil, Check, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { AppSettings } from '@/hooks/useSettings';

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

export interface PackagingItem {
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
  packagingItems: PackagingItem[];
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
    packagingItems: PackagingItem[];
    hardwareItems: HardwareItem[];
  },
  listingFee: number = LISTING_FEE
) {
  const fil = filaments.find((f) => f.id === state.filamentId);
  const filamentCost    = fil ? (state.filamentGrams / 1000) * fil.costPerKg : 0;
  const electricityCost = state.printHours * (state.printerWatts / 1000) * state.kwHRate;
  const hardwareCost    = state.hardwareItems.reduce((s, h) => s + h.cost, 0);
  const packagingCost   = state.packagingItems.reduce((s, p) => s + p.cost, 0);
  const baseCost        = filamentCost + electricityCost + packagingCost + hardwareCost + listingFee;
  return { filamentCost, electricityCost, hardwareCost, packagingCost, baseCost };
}

export function marginFromPrice(
  baseCost: number,
  salePrice: number,
  withEtsy = true,
  transactionRate: number = TRANSACTION_RATE,
  processingRate: number = PROCESSING_RATE,
  processingFixed: number = PROCESSING_FIXED,
) {
  if (salePrice <= 0) return 0;
  const fees = withEtsy
    ? salePrice * transactionRate + salePrice * processingRate + processingFixed
    : 0;
  return (salePrice - baseCost - fees) / salePrice;
}

export function priceFromMargin(
  baseCost: number,
  targetMargin: number,
  withEtsy = true,
  transactionRate: number = TRANSACTION_RATE,
  processingRate: number = PROCESSING_RATE,
  processingFixed: number = PROCESSING_FIXED,
) {
  if (!withEtsy) {
    const denom = 1 - targetMargin;
    return denom <= 0 ? 0 : baseCost / denom;
  }
  const denom = 1 - transactionRate - processingRate - targetMargin;
  if (denom <= 0) return 0;
  return (baseCost + processingFixed) / denom;
}

// ─── Main Component ───────────────────────────────────────────────────────────

function getBlankState(settings?: AppSettings) {
  return {
    filamentId: 'pla',
    filamentGrams: 100,
    printHours: 4,
    printerWatts: settings?.printing.defaultWatts ?? 250,
    kwHRate: settings?.printing.defaultKwhRate ?? 0.13,
    packagingItems: [{ id: 'pkg-default', name: 'Box / Mailer', cost: 0.75 }] as PackagingItem[],
    hardwareItems: [] as HardwareItem[],
  };
}

// ─── ResultsPanel ─────────────────────────────────────────────────────────────

interface ResultsPanelProps {
  baseCost: number;
  filamentCost: number;
  electricityCost: number;
  hardwareCost: number;
  packagingCost: number;
  salePrice: number;
  targetMargin: number;
  lastEdited: 'price' | 'margin';
  displayMargin: number;
  displayPrice: number;
  etsyEnabled: boolean;
  onPriceChange: (v: number) => void;
  onMarginChange: (v: number) => void;
  liveFees: {
    listingFee: number;
    transactionRate: number;
    processingRate: number;
    processingFixed: number;
  };
}

function ResultsPanel({
  baseCost, filamentCost, electricityCost, hardwareCost, packagingCost,
  salePrice, targetMargin, lastEdited, displayMargin, displayPrice,
  etsyEnabled, onPriceChange, onMarginChange, liveFees,
}: ResultsPanelProps) {
  const activeSalePrice = lastEdited === 'price' ? salePrice : displayPrice;
  const activeMargin    = lastEdited === 'margin' ? targetMargin : displayMargin;

  const etsyFees =
    etsyEnabled && activeSalePrice > 0
      ? activeSalePrice * liveFees.transactionRate + activeSalePrice * liveFees.processingRate + liveFees.processingFixed
      : 0;
  const profit = activeSalePrice > 0 ? activeSalePrice - baseCost - etsyFees : 0;

  const rawChartData = [
    { name: 'Filament',    value: filamentCost },
    { name: 'Electricity', value: electricityCost },
    { name: 'Packaging',   value: packagingCost },
    { name: 'Hardware',    value: hardwareCost },
    ...(etsyEnabled && etsyFees > 0 ? [{ name: 'Etsy Fees', value: etsyFees }] : []),
  ];
  const chartData = rawChartData.filter((d) => d.value > 0);

  const marginBadgeCls =
    activeMargin < 15
      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
      : activeMargin < 30
      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
      : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';

  const inputCls =
    'w-full bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-slate-200 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500/60 transition-colors tabular-nums';
  const labelCls =
    'block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5';

  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none p-4 sm:p-5 mb-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Results</h3>

      {/* Total cost */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Cost</span>
        <span className="text-lg font-bold text-slate-800 dark:text-slate-200 font-mono tabular-nums">${baseCost.toFixed(2)}</span>
      </div>

      {/* Donut chart */}
      {chartData.length > 0 && (
        <div className="mb-4" style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 8, right: 16, bottom: 0, left: 16 }}>
              <Pie
                data={chartData}
                innerRadius={55}
                outerRadius={82}
                dataKey="value"
                paddingAngle={2}
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => `$${Number(v).toFixed(2)}`}
                contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                iconSize={10}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Two-way inputs */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className={labelCls}>Sale Price ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className={inputCls}
            value={lastEdited === 'price' ? salePrice : Number(displayPrice.toFixed(2))}
            onChange={(e) => onPriceChange(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className={labelCls}>Target Margin (%)</label>
          <input
            type="number"
            min="0"
            max="99"
            step="0.1"
            className={inputCls}
            value={lastEdited === 'margin' ? targetMargin : Number(displayMargin.toFixed(1))}
            onChange={(e) => onMarginChange(parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* Profit summary */}
      {activeSalePrice > 0 ? (
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700/50">
          <span
            className={`text-sm font-bold font-mono tabular-nums ${
              profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {profit >= 0 ? '+' : ''}${profit.toFixed(2)} profit
          </span>
          <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${marginBadgeCls}`}>
            {activeMargin.toFixed(1)}% margin
          </span>
        </div>
      ) : (
        <p className="text-xs text-center text-slate-400 dark:text-slate-500">
          Enter a sale price or target margin to see results
        </p>
      )}
    </div>
  );
}

export function MarginCalculatorView({ settings }: { settings?: AppSettings }) {
  const [filaments, setFilaments] = useState<FilamentPreset[]>(loadFilaments);
  const [presets, setPresets]     = useState<ProductPreset[]>(loadPresets);

  // Working state
  const [filamentId, setFilamentId]       = useState(() => getBlankState(settings).filamentId);
  const [filamentGrams, setFilamentGrams] = useState(() => getBlankState(settings).filamentGrams);
  const [printHours, setPrintHours]       = useState(() => getBlankState(settings).printHours);
  const [printerWatts, setPrinterWatts]   = useState(() => settings?.printing.defaultWatts ?? 250);
  const [kwHRate, setKwHRate]             = useState(() => settings?.printing.defaultKwhRate ?? 0.13);
  const [packagingItems, setPackagingItems] = useState<PackagingItem[]>(() => getBlankState(settings).packagingItems);
  const [hardwareItems, setHardwareItems]   = useState<HardwareItem[]>([]);
  const [etsyEnabled, setEtsyEnabled]       = useState(true);

  // Results state
  const [salePrice, setSalePrice]       = useState<number>(0);
  const [targetMargin, setTargetMargin] = useState<number>(30);
  const [lastEdited, setLastEdited]     = useState<'price' | 'margin'>('margin');

  // UI state
  const [showLibrary, setShowLibrary]       = useState(false);
  const [saveNameDraft, setSaveNameDraft]   = useState('');
  const [showSaveInput, setShowSaveInput]   = useState(false);

  // Live fee values from settings, falling back to exported constants
  const liveFees = {
    listingFee:      settings?.etsyFees.listingFee      ?? LISTING_FEE,
    transactionRate: settings?.etsyFees.transactionRate ?? TRANSACTION_RATE,
    processingRate:  settings?.etsyFees.processingRate  ?? PROCESSING_RATE,
    processingFixed: settings?.etsyFees.processingFixed ?? PROCESSING_FIXED,
  };

  const currentState = { filamentId, filamentGrams, printHours, printerWatts, kwHRate, packagingItems, hardwareItems };
  const { filamentCost, electricityCost, hardwareCost, packagingCost, baseCost } = calcCosts(filaments, currentState, liveFees.listingFee);

  // When Etsy fees are disabled, remove the fixed listingFee from the effective cost basis
  const effectiveBaseCost = etsyEnabled ? baseCost : baseCost - liveFees.listingFee;

  const displayMargin = marginFromPrice(effectiveBaseCost, salePrice, etsyEnabled, liveFees.transactionRate, liveFees.processingRate, liveFees.processingFixed) * 100;
  const displayPrice  = priceFromMargin(effectiveBaseCost, targetMargin / 100, etsyEnabled, liveFees.transactionRate, liveFees.processingRate, liveFees.processingFixed);

  function handlePriceChange(val: number) {
    setSalePrice(val);
    setLastEdited('price');
    setTargetMargin(Math.round(marginFromPrice(effectiveBaseCost, val, etsyEnabled, liveFees.transactionRate, liveFees.processingRate, liveFees.processingFixed) * 1000) / 10);
  }

  function handleMarginChange(val: number) {
    setTargetMargin(val);
    setLastEdited('margin');
    setSalePrice(Math.round(priceFromMargin(effectiveBaseCost, val / 100, etsyEnabled, liveFees.transactionRate, liveFees.processingRate, liveFees.processingFixed) * 100) / 100);
  }

  function loadPreset(id: string) {
    const p = presets.find((x) => x.id === id);
    if (!p) return;
    setFilamentId(p.filamentId);
    setFilamentGrams(p.filamentGrams);
    setPrintHours(p.printHours);
    setPrinterWatts(p.printerWatts);
    setKwHRate(p.kwHRate);
    // Migrate old presets that stored a single packagingCost number
    setPackagingItems(
      p.packagingItems ?? [{ id: uid(), name: 'Packaging', cost: ((p as unknown) as { packagingCost?: number }).packagingCost ?? 0.75 }]
    );
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
    const blank = getBlankState(settings);
    setFilamentId(blank.filamentId);
    setFilamentGrams(blank.filamentGrams);
    setPrintHours(blank.printHours);
    setPrinterWatts(blank.printerWatts);
    setKwHRate(blank.kwHRate);
    setPackagingItems(blank.packagingItems);
    setHardwareItems([]);
  }

  // Filament library helpers
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

  // Style helpers — baseInputCls omits w-full so flex children can use flex-1 properly
  const baseInputCls = 'bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-slate-200 text-sm rounded-xl px-3.5 py-2.5 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500/60 transition-colors';
  const inputCls  = `w-full ${baseInputCls}`;
  const numCls    = `${inputCls} tabular-nums`;
  const labelCls  = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5';
  const cardCls   = 'bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none p-4 sm:p-5 mb-4';
  const inlineCost = (val: number) => (
    <span className="ml-auto text-xs text-emerald-600 dark:text-emerald-400 font-mono font-semibold tabular-nums">
      ${val.toFixed(2)}
    </span>
  );

  return (
    <div className="max-w-2xl mx-auto pb-24 sm:pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center">
          <Calculator size={20} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Margin Calculator</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">3D print Etsy listing cost & margin analyzer</p>
        </div>
      </div>

      {/* Preset bar */}
      <div className={cardCls}>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className={`${inputCls} w-auto flex-1 min-w-0`}
            defaultValue=""
            onChange={(e) => { if (e.target.value) loadPreset(e.target.value); e.currentTarget.value = ''; }}
          >
            <option value="">Load preset…</option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {showSaveInput ? (
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <input
                type="text"
                className={`${inputCls} flex-1 min-w-0`}
                placeholder="Preset name…"
                value={saveNameDraft}
                onChange={(e) => setSaveNameDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') savePreset(); if (e.key === 'Escape') setShowSaveInput(false); }}
                autoFocus
              />
              <button
                onClick={savePreset}
                className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shrink-0"
              >
                <Check size={15} />
              </button>
              <button
                onClick={() => setShowSaveInput(false)}
                className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors shrink-0"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSaveInput(true)}
              className="px-3 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shrink-0"
            >
              Save as…
            </button>
          )}

          <button
            onClick={resetState}
            className="px-3 py-2 text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors shrink-0"
          >
            New
          </button>
        </div>

        {presets.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {presets.map((p) => (
              <div key={p.id} className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 rounded-lg px-2 py-1">
                <span className="text-xs text-slate-700 dark:text-slate-300">{p.name}</span>
                <button
                  onClick={() => deletePreset(p.id)}
                  className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filament & Materials */}
      <div className={cardCls}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Filament & Materials</h3>
          <button
            onClick={() => setShowLibrary((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <Pencil size={12} />
            Edit Library
          </button>
        </div>

        {showLibrary && (
          <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700/50">
            <div className="space-y-2">
              {filaments.map((f) => (
                <div key={f.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    className={`flex-1 min-w-0 ${baseInputCls}`}
                    value={f.name}
                    onChange={(e) => updateFilament(f.id, 'name', e.target.value)}
                    placeholder="Name"
                  />
                  <input
                    type="number"
                    className={`w-24 shrink-0 ${baseInputCls} tabular-nums`}
                    value={f.costPerKg}
                    onChange={(e) => updateFilament(f.id, 'costPerKg', parseFloat(e.target.value) || 0)}
                    placeholder="$/kg"
                    step="0.01"
                    min="0"
                  />
                  <button
                    onClick={() => removeFilament(f.id)}
                    className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addFilament}
              className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <Plus size={13} /> Add filament
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Filament type</label>
            <select
              className={inputCls}
              value={filamentId}
              onChange={(e) => setFilamentId(e.target.value)}
            >
              {filaments.map((f) => (
                <option key={f.id} value={f.id}>{f.name} (${f.costPerKg}/kg)</option>
              ))}
            </select>
          </div>
          <div>
            <div className="flex items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Grams used</label>
              {inlineCost(filamentCost)}
            </div>
            <input
              type="number"
              className={numCls}
              value={filamentGrams}
              onChange={(e) => setFilamentGrams(parseFloat(e.target.value) || 0)}
              min="0"
              step="1"
              placeholder="100"
            />
          </div>
        </div>
      </div>

      {/* Print Settings */}
      <div className={cardCls}>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Print Settings</h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Print time (hr)</label>
            <input
              type="number"
              className={numCls}
              value={printHours}
              onChange={(e) => setPrintHours(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.5"
              placeholder="4"
            />
          </div>
          <div>
            <label className={labelCls}>Printer (W)</label>
            <input
              type="number"
              className={numCls}
              value={printerWatts}
              onChange={(e) => setPrinterWatts(parseFloat(e.target.value) || 0)}
              min="0"
              step="10"
              placeholder="250"
            />
          </div>
          <div>
            <div className="flex items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rate ($/kWh)</label>
              {inlineCost(electricityCost)}
            </div>
            <input
              type="number"
              className={numCls}
              value={kwHRate}
              onChange={(e) => setKwHRate(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              placeholder="0.13"
            />
          </div>
        </div>
      </div>

      {/* Packaging */}
      <div className={cardCls}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Packaging</h3>
          {packagingItems.length > 1 && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-semibold tabular-nums">
              Total: ${packagingCost.toFixed(2)}
            </span>
          )}
        </div>
        <div className="space-y-2">
          {packagingItems.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <input
                type="text"
                className={`flex-1 min-w-0 ${baseInputCls}`}
                value={item.name}
                onChange={(e) =>
                  setPackagingItems((prev) =>
                    prev.map((p) => (p.id === item.id ? { ...p, name: e.target.value } : p))
                  )
                }
                placeholder="Item name"
              />
              <input
                type="number"
                className={`w-28 shrink-0 ${baseInputCls} tabular-nums`}
                value={item.cost}
                onChange={(e) =>
                  setPackagingItems((prev) =>
                    prev.map((p) => (p.id === item.id ? { ...p, cost: parseFloat(e.target.value) || 0 } : p))
                  )
                }
                min="0"
                step="0.25"
                placeholder="0.00"
              />
              <button
                onClick={() => setPackagingItems((prev) => prev.filter((p) => p.id !== item.id))}
                className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => setPackagingItems((prev) => [...prev, { id: uid(), name: '', cost: 0 }])}
          className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          <Plus size={13} /> Add item
        </button>
      </div>

      {/* Hardware Add-ons */}
      <div className={cardCls}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Hardware Add-ons</h3>
          {hardwareItems.length > 0 && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-semibold tabular-nums">
              Total: ${hardwareCost.toFixed(2)}
            </span>
          )}
        </div>
        <div className="space-y-2">
          {hardwareItems.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <input
                type="text"
                className={`flex-1 min-w-0 ${baseInputCls}`}
                value={item.name}
                onChange={(e) =>
                  setHardwareItems((prev) =>
                    prev.map((h) => (h.id === item.id ? { ...h, name: e.target.value } : h))
                  )
                }
                placeholder="Item name"
              />
              <input
                type="number"
                className={`w-28 shrink-0 ${baseInputCls} tabular-nums`}
                value={item.cost}
                onChange={(e) =>
                  setHardwareItems((prev) =>
                    prev.map((h) => (h.id === item.id ? { ...h, cost: parseFloat(e.target.value) || 0 } : h))
                  )
                }
                min="0"
                step="0.01"
                placeholder="0.00"
              />
              <button
                onClick={() => setHardwareItems((prev) => prev.filter((h) => h.id !== item.id))}
                className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => setHardwareItems((prev) => [...prev, { id: uid(), name: '', cost: 0 }])}
          className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          <Plus size={13} /> Add item
        </button>
      </div>

      {/* Etsy Fees */}
      <div className={cardCls}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Etsy Fees</h3>
          <button
            onClick={() => setEtsyEnabled((v) => !v)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
              etsyEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
            }`}
            aria-label="Toggle Etsy fees"
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                etsyEnabled ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
        <div className={`space-y-2 text-xs text-slate-500 dark:text-slate-400 transition-opacity ${!etsyEnabled ? 'opacity-40' : ''}`}>
          <div className="flex items-center justify-between">
            <span>Listing fee (per sale)</span>
            <span className="font-mono tabular-nums">${liveFees.listingFee.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Transaction fee</span>
            <span className="font-mono tabular-nums">{(liveFees.transactionRate * 100).toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Payment processing</span>
            <span className="font-mono tabular-nums">{(liveFees.processingRate * 100)}% + ${liveFees.processingFixed.toFixed(2)}</span>
          </div>
          <p className="text-slate-400 dark:text-slate-500 pt-1">
            {etsyEnabled
              ? 'Fees apply to sale price and are included in margin calculations.'
              : 'Etsy fees disabled — calculations reflect direct costs only.'}
          </p>
        </div>
      </div>

      {/* Results */}
      <ResultsPanel
        baseCost={effectiveBaseCost}
        filamentCost={filamentCost}
        electricityCost={electricityCost}
        hardwareCost={hardwareCost}
        packagingCost={packagingCost}
        salePrice={salePrice}
        targetMargin={targetMargin}
        lastEdited={lastEdited}
        displayMargin={displayMargin}
        displayPrice={displayPrice}
        etsyEnabled={etsyEnabled}
        onPriceChange={handlePriceChange}
        onMarginChange={handleMarginChange}
        liveFees={liveFees}
      />
    </div>
  );
}
