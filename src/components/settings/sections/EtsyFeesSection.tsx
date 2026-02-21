import type { AppSettings, SettingsUpdate } from '@/hooks/useSettings';
import { Card } from '@/components/ui/Card';
import { Field, Input } from '@/components/ui/Input';

interface Props {
  settings: AppSettings;
  update: (p: SettingsUpdate) => void;
}

export function EtsyFeesSection({ settings, update }: Props) {
  const f = settings.etsyFees;
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          These rates feed directly into the Margin Calculator. Update them if Etsy changes their fee structure.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Listing Fee ($)" helper="Per-sale listing renewal">
            <Input
              type="number"
              value={f.listingFee}
              min={0}
              step={0.01}
              onChange={(e) => update({ etsyFees: { listingFee: parseFloat(e.target.value) || 0 } })}
            />
          </Field>
          <Field label="Transaction Rate (%)" helper="Currently 6.5%">
            <Input
              type="number"
              value={(f.transactionRate * 100).toFixed(1)}
              min={0}
              max={100}
              step={0.1}
              onChange={(e) => update({ etsyFees: { transactionRate: (parseFloat(e.target.value) || 0) / 100 } })}
            />
          </Field>
          <Field label="Processing Rate (%)" helper="Etsy Payments %">
            <Input
              type="number"
              value={(f.processingRate * 100).toFixed(1)}
              min={0}
              max={100}
              step={0.1}
              onChange={(e) => update({ etsyFees: { processingRate: (parseFloat(e.target.value) || 0) / 100 } })}
            />
          </Field>
          <Field label="Processing Fixed ($)" helper="Flat fee per transaction">
            <Input
              type="number"
              value={f.processingFixed}
              min={0}
              step={0.01}
              onChange={(e) => update({ etsyFees: { processingFixed: parseFloat(e.target.value) || 0 } })}
            />
          </Field>
        </div>
      </Card>

      {/* Info note */}
      <div className="px-4 py-3 bg-[var(--color-brand-subtle)] border border-[var(--color-brand-border)] rounded-[var(--radius-lg)]">
        <p className="text-xs text-[var(--color-brand)]">
          Verify current rates at <span className="font-semibold">etsy.com/seller-handbook</span> — Etsy occasionally adjusts fees.
        </p>
      </div>
    </div>
  );
}
