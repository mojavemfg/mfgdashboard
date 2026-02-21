import { useState } from 'react';
import { Download, Trash2 } from 'lucide-react';

const cardCls   = 'bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none p-5';
const labelCls  = 'text-sm font-medium text-slate-800 dark:text-slate-200';
const hintCls   = 'text-xs text-slate-500 dark:text-slate-400';
const dangerCls = 'flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/50 last:border-0';

const DATA_STORES = [
  { key: 'mfg_settings',           label: 'App Settings' },
  { key: 'margin_filament_library', label: 'Filament Library' },
  { key: 'margin_presets',          label: 'Margin Presets' },
  { key: 'mfg-print-inventory',     label: 'Print Inventory' },
  { key: 'theme',                   label: 'Theme Preference' },
];

export function DataManagementSection() {
  const [cleared, setCleared] = useState<string | null>(null);

  function exportAll() {
    const data: Record<string, unknown> = {};
    DATA_STORES.forEach(({ key }) => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) data[key] = JSON.parse(raw);
      } catch { data[key] = localStorage.getItem(key); }
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `mfg-ops-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearStore(key: string) {
    localStorage.removeItem(key);
    setCleared(key);
    setTimeout(() => setCleared(null), 2000);
  }

  return (
    <div className="space-y-4">
      <div className={cardCls}>
        <div className="flex items-center justify-between">
          <div>
            <p className={labelCls}>Export All Data</p>
            <p className={hintCls}>Download a JSON backup of all stored app data</p>
          </div>
          <button
            onClick={exportAll}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors border-none cursor-pointer"
          >
            <Download size={13} />
            Export
          </button>
        </div>
      </div>

      <div className={cardCls}>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Clear Data
        </p>
        <div>
          {DATA_STORES.map(({ key, label }) => (
            <div key={key} className={dangerCls}>
              <div>
                <p className={labelCls}>{label}</p>
                <p className={hintCls}>{key}</p>
              </div>
              <button
                onClick={() => clearStore(key)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer bg-transparent"
              >
                {cleared === key ? 'Cleared' : <><Trash2 size={12} /> Clear</>}
              </button>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
          Clearing data is immediate and cannot be undone. Export first if you want a backup.
        </p>
      </div>
    </div>
  );
}
