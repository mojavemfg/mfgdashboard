import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
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
  const [activeSectionId, setActiveSectionId] = useState(() =>
    window.matchMedia('(min-width: 768px)').matches ? 'shop-profile' : ''
  );

  const activeSection = SETTINGS_SECTIONS.find((s) => s.id === activeSectionId);

  function renderSection() {
    switch (activeSectionId) {
      case 'shop-profile':     return <ShopProfileSection settings={settings} update={update} />;
      case 'printing':         return <PrintingDefaultsSection settings={settings} update={update} />;
      case 'etsy-fees':        return <EtsyFeesSection settings={settings} update={update} />;
      case 'inventory-alerts': return <InventoryAlertsSection settings={settings} update={update} />;
      case 'appearance':       return <AppearanceSection isDark={isDark} onThemeToggle={onThemeToggle} />;
      case 'data-management':  return <DataManagementSection />;
      default:                 return null;
    }
  }

  return (
    <div className="max-w-4xl pb-24 lg:pb-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">Settings</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            Manage your shop configuration and preferences
          </p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left nav */}
        <div className={`shrink-0 ${activeSectionId ? 'hidden md:block' : 'block'}`}>
          <SettingsNav activeSectionId={activeSectionId} onSelect={setActiveSectionId} />
        </div>

        {/* Content */}
        <div className={`flex-1 min-w-0 max-w-xl ${!activeSectionId ? 'hidden md:block' : 'block'}`}>
          {/* Mobile back button */}
          <button
            onClick={() => setActiveSectionId('')}
            className={[
              'md:hidden flex items-center gap-1.5 text-sm font-medium mb-4',
              'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
              'transition-colors duration-150 focus-visible:outline-none',
            ].join(' ')}
          >
            <ChevronLeft size={16} />
            Settings
          </button>

          {activeSection && (
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                {activeSection.label}
              </h2>
            </div>
          )}

          {renderSection()}
        </div>
      </div>
    </div>
  );
}
