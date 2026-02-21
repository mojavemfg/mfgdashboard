import type { AppSettings, SettingsUpdate } from '@/hooks/useSettings';

const cardCls  = 'bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none p-5';
const labelCls = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5';
const numCls   = 'w-full bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-slate-200 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/60 transition-colors tabular-nums';
const hintCls  = 'mt-1.5 text-xs text-slate-400 dark:text-slate-500';

interface Props {
  settings: AppSettings;
  update: (p: SettingsUpdate) => void;
}

export function PrintingDefaultsSection({ settings, update }: Props) {
  return (
    <div className={cardCls}>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
        These values pre-fill the Margin Calculator for new calculations.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Printer Wattage (W)</label>
          <input
            type="number"
            className={numCls}
            value={settings.printing.defaultWatts}
            min={0}
            step={10}
            onChange={(e) => update({ printing: { defaultWatts: parseFloat(e.target.value) || 0 } })}
          />
          <p className={hintCls}>Typical range: 100–500W</p>
        </div>
        <div>
          <label className={labelCls}>Electricity Rate ($/kWh)</label>
          <input
            type="number"
            className={numCls}
            value={settings.printing.defaultKwhRate}
            min={0}
            step={0.01}
            onChange={(e) => update({ printing: { defaultKwhRate: parseFloat(e.target.value) || 0 } })}
          />
          <p className={hintCls}>US average ~$0.13</p>
        </div>
      </div>
    </div>
  );
}
