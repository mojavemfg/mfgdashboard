import type { AppSettings, SettingsUpdate } from '@/hooks/useSettings';

const cardCls  = 'bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none p-5';
const labelCls = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5';
const numCls   = 'w-full bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-slate-200 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/60 transition-colors tabular-nums';

interface Props {
  settings: AppSettings;
  update: (p: SettingsUpdate) => void;
}

export function InventoryAlertsSection({ settings, update }: Props) {
  const inv = settings.inventory;
  return (
    <div className="space-y-4">
      <div className={cardCls}>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Alert thresholds are calculated as a multiple of each item's safety stock level.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Critical Threshold (×)</label>
            <input
              type="number"
              className={numCls}
              value={inv.criticalMultiplier}
              min={0.1}
              max={inv.warningMultiplier - 0.1}
              step={0.1}
              onChange={(e) => update({ inventory: { criticalMultiplier: parseFloat(e.target.value) || 1 } })}
            />
            <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">
              Stock &lt; {inv.criticalMultiplier}× safety stock → Critical
            </p>
          </div>
          <div>
            <label className={labelCls}>Warning Threshold (×)</label>
            <input
              type="number"
              className={numCls}
              value={inv.warningMultiplier}
              min={inv.criticalMultiplier + 0.1}
              step={0.1}
              onChange={(e) => update({ inventory: { warningMultiplier: parseFloat(e.target.value) || 1.5 } })}
            />
            <p className="mt-1.5 text-xs text-amber-500 dark:text-amber-400">
              Stock &lt; {inv.warningMultiplier}× safety stock → Warning
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
