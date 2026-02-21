import type { AppSettings, SettingsUpdate } from '@/hooks/useSettings';

const cardCls  = 'bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none p-5';
const labelCls = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5';
const inputCls = 'w-full bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-slate-200 text-sm rounded-xl px-3.5 py-2.5 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/60 transition-colors';

interface Props {
  settings: AppSettings;
  update: (p: SettingsUpdate) => void;
}

export function ShopProfileSection({ settings, update }: Props) {
  return (
    <div className={cardCls}>
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Business Name</label>
          <input
            type="text"
            className={inputCls}
            value={settings.shopName}
            placeholder="Mojave MFG"
            onChange={(e) => update({ shopName: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls}>Etsy Shop Name</label>
          <input
            type="text"
            className={inputCls}
            value={settings.etsyShopName}
            placeholder="YourEtsyShop"
            onChange={(e) => update({ etsyShopName: e.target.value })}
          />
          {settings.etsyShopName && (
            <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
              etsy.com/shop/{settings.etsyShopName}
            </p>
          )}
        </div>
        <div>
          <label className={labelCls}>Currency</label>
          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 dark:bg-slate-700/50 rounded-xl text-sm text-slate-500 dark:text-slate-400">
            USD — US Dollar
          </div>
        </div>
      </div>
    </div>
  );
}
