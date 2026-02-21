import type { AppSettings, SettingsUpdate } from '@/hooks/useSettings';
import { Card } from '@/components/ui/Card';
import { Field, Input } from '@/components/ui/Input';

interface Props {
  settings: AppSettings;
  update: (p: SettingsUpdate) => void;
}

export function PrintingDefaultsSection({ settings, update }: Props) {
  return (
    <Card>
      <p className="text-sm text-[var(--color-text-secondary)] mb-4">
        These values pre-fill the Margin Calculator for new calculations.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Printer Wattage (W)" helper="Typical range: 100–500W">
          <Input
            type="number"
            value={settings.printing.defaultWatts}
            min={0}
            step={10}
            onChange={(e) => update({ printing: { defaultWatts: parseFloat(e.target.value) || 0 } })}
          />
        </Field>
        <Field label="Electricity Rate ($/kWh)" helper="US average ~$0.13">
          <Input
            type="number"
            value={settings.printing.defaultKwhRate}
            min={0}
            step={0.01}
            onChange={(e) => update({ printing: { defaultKwhRate: parseFloat(e.target.value) || 0 } })}
          />
        </Field>
      </div>
    </Card>
  );
}
