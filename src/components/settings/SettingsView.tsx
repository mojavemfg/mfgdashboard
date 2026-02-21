import { useState } from 'react';
import { SettingsNav, SETTINGS_SECTIONS } from './SettingsNav';
import type { AppSettings, SettingsUpdate } from '@/hooks/useSettings';
import { ShopProfileSection } from './sections/ShopProfileSection';
import { PrintingDefaultsSection } from './sections/PrintingDefaultsSection';
import { EtsyFeesSection } from './sections/EtsyFeesSection';
import { InventoryAlertsSection } from './sections/InventoryAlertsSection';
import { AppearanceSection } from './sections/AppearanceSection';
import { DataManagementSection } from './sections/DataManagementSection';

interface SettingsViewProps {
  settings: AppSettings;
  update: (partial: SettingsUpdate) => void;
  isDark: boolean;
  onThemeToggle: () => void;
}

export function SettingsView({ settings, update, isDark, onThemeToggle }: SettingsViewProps) {
  const [activeSectionId, setActiveSectionId] = useState('shop-profile');

  function renderSection() {
    switch (activeSectionId) {
      case 'shop-profile':     return <ShopProfileSection settings={settings} update={update} />;
      case 'printing':         return <PrintingDefaultsSection settings={settings} update={update} />;
      case 'etsy-fees':        return <EtsyFeesSection settings={settings} update={update} />;
      case 'inventory-alerts': return <InventoryAlertsSection settings={settings} update={update} />;
      case 'appearance':       return <AppearanceSection isDark={isDark} onThemeToggle={onThemeToggle} settings={settings} update={update} />;
      case 'data-management':  return <DataManagementSection />;
      default:                 return null;
    }
  }

  return (
    <div className="max-w-4xl pb-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">Settings</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
          Manage your shop configuration and preferences
        </p>
      </div>

      {/* Mobile tab navigation — select dropdown (< md) */}
      <div className="md:hidden mb-4">
        <select
          value={activeSectionId}
          onChange={(e) => setActiveSectionId(e.target.value)}
          className={[
            'w-full h-8 px-3 text-sm rounded-[var(--radius-md)]',
            'border border-[var(--color-border)] bg-[var(--color-bg)]',
            'text-[var(--color-text-primary)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]',
          ].join(' ')}
        >
          {SETTINGS_SECTIONS.map(({ id, label }) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
      </div>

      {/* Desktop/tablet two-panel layout (md+) */}
      <div className="flex gap-6">
        {/* Left nav — only on md+ */}
        <div className="hidden md:block shrink-0">
          <SettingsNav activeSectionId={activeSectionId} onSelect={setActiveSectionId} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 max-w-xl">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}
