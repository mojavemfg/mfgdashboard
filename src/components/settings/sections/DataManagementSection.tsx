import { useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

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
      } catch {
        data[key] = localStorage.getItem(key);
      }
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
    <div className="flex flex-col gap-4">
      {/* Export */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">Export All Data</p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
              Download a JSON backup of all stored app data
            </p>
          </div>
          <Button variant="primary" size="sm" iconLeft={<Download size={13} />} onClick={exportAll}>
            Export
          </Button>
        </div>
      </Card>

      {/* Clear individual stores */}
      <Card>
        <p className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-3">
          Clear Data
        </p>
        <div className="divide-y divide-[var(--color-border)]">
          {DATA_STORES.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">{label}</p>
                <p className="text-xs text-[var(--color-text-tertiary)] font-mono mt-0.5">{key}</p>
              </div>
              <Button
                variant="danger"
                size="sm"
                iconLeft={cleared !== key ? <Trash2 size={12} /> : undefined}
                onClick={() => clearStore(key)}
              >
                {cleared === key ? 'Cleared' : 'Clear'}
              </Button>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-[var(--color-text-tertiary)]">
          Clearing is immediate and cannot be undone. Export first if you want a backup.
        </p>
      </Card>
    </div>
  );
}
