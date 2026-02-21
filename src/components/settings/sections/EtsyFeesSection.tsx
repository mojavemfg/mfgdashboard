import type { AppSettings, SettingsUpdate } from '@/hooks/useSettings';

const cardCls  = 'bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none p-5';
const labelCls = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5';
const numCls   = 'w-full bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-slate-200 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/60 transition-colors tabular-nums';
const hintCls  = 'mt-1.5 text-xs text-slate-400 dark:text-slate-500';

interface Props {
  settings: AppSettings;
  update: (p: SettingsUpdate) => void;
}

export function EtsyFeesSection({ settings, update }: Props) {
  const f = settings.etsyFees;
  return (
    <div className="space-y-4">
      <div className={cardCls}>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          These rates feed directly into the Margin Calculator. Update them if Etsy changes their fee structure.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Listing Fee ($)</label>
            <input type="number" className={numCls} value={f.listingFee} min={0} step={0.01}
              onChange={(e) => update({ etsyFees: { listingFee: parseFloat(e.target.value) || 0 } })} />
            <p className={hintCls}>Per-sale listing renewal</p>
          </div>
          <div>
            <label className={labelCls}>Transaction Rate (%)</label>
            <input type="number" className={numCls} value={(f.transactionRate * 100).toFixed(1)} min={0} max={100} step={0.1}
              onChange={(e) => update({ etsyFees: { transactionRate: (parseFloat(e.target.value) || 0) / 100 } })} />
            <p className={hintCls}>Currently 6.5%</p>
          </div>
          <div>
            <label className={labelCls}>Processing Rate (%)</label>
            <input type="number" className={numCls} value={(f.processingRate * 100).toFixed(1)} min={0} max={100} step={0.1}
              onChange={(e) => update({ etsyFees: { processingRate: (parseFloat(e.target.value) || 0) / 100 } })} />
            <p className={hintCls}>Etsy Payments %</p>
          </div>
          <div>
            <label className={labelCls}>Processing Fixed ($)</label>
            <input type="number" className={numCls} value={f.processingFixed} min={0} step={0.01}
              onChange={(e) => update({ etsyFees: { processingFixed: parseFloat(e.target.value) || 0 } })} />
            <p className={hintCls}>Flat fee per transaction</p>
          </div>
        </div>
      </div>
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 rounded-2xl p-4">
        <p className="text-xs text-blue-700 dark:text-blue-400">
          Verify current rates at <span className="font-semibold">etsy.com/seller-handbook</span> — Etsy occasionally adjusts fees.
        </p>
      </div>
    </div>
  );
}
