import type { AppSettings, SettingsUpdate } from '@/hooks/useSettings';
import { Card } from '@/components/ui/Card';
import { Field, Input } from '@/components/ui/Input';

interface Props {
  settings: AppSettings;
  update: (p: SettingsUpdate) => void;
}

export function InventoryAlertsSection({ settings, update }: Props) {
  const inv = settings.inventory;
  return (
    <Card>
      <p className="text-sm text-[var(--color-text-secondary)] mb-4">
        Alert thresholds are calculated as a multiple of each item's safety stock level.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Critical Threshold (×)"
          error={`Stock < ${inv.criticalMultiplier}× safety stock → Critical`}
        >
          <Input
            type="number"
            value={inv.criticalMultiplier}
            min={0.1}
            max={inv.warningMultiplier - 0.1}
            step={0.1}
            onChange={(e) => update({ inventory: { criticalMultiplier: parseFloat(e.target.value) || 1 } })}
          />
        </Field>
        <Field
          label="Warning Threshold (×)"
          helper={`Stock < ${inv.warningMultiplier}× safety stock → Warning`}
        >
          <Input
            type="number"
            value={inv.warningMultiplier}
            min={inv.criticalMultiplier + 0.1}
            step={0.1}
            onChange={(e) => update({ inventory: { warningMultiplier: parseFloat(e.target.value) || 1.5 } })}
          />
        </Field>
      </div>
    </Card>
  );
}
