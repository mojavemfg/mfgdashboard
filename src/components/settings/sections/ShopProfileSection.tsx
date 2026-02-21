import type { AppSettings, SettingsUpdate } from '@/hooks/useSettings';
import { Card } from '@/components/ui/Card';
import { Field, Input } from '@/components/ui/Input';

interface Props {
  settings: AppSettings;
  update: (p: SettingsUpdate) => void;
}

export function ShopProfileSection({ settings, update }: Props) {
  return (
    <Card>
      <div className="flex flex-col gap-4">
        <Field label="Business Name">
          <Input
            type="text"
            value={settings.shopName}
            placeholder="Mojave MFG"
            onChange={(e) => update({ shopName: e.target.value })}
          />
        </Field>

        <Field
          label="Etsy Shop Name"
          helper={settings.etsyShopName ? `etsy.com/shop/${settings.etsyShopName}` : undefined}
        >
          <Input
            type="text"
            value={settings.etsyShopName}
            placeholder="YourEtsyShop"
            onChange={(e) => update({ etsyShopName: e.target.value })}
          />
        </Field>

        <Field label="Currency">
          <div className="h-8 flex items-center px-3 text-sm text-[var(--color-text-tertiary)] bg-[var(--color-bg-muted)] border border-[var(--color-border)] rounded-[var(--radius-md)]">
            USD — US Dollar
          </div>
        </Field>
      </div>
    </Card>
  );
}
