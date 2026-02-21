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
    <div className="max-w-4xl mx-auto pb-24 md:pb-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Settings</h1>

      <div className="flex gap-6">
        {/* Left nav — hidden on mobile when a section is active */}
        <div className={`shrink-0 w-52 ${activeSectionId ? 'hidden md:block' : 'block'}`}>
          <SettingsNav activeSectionId={activeSectionId} onSelect={setActiveSectionId} />
        </div>

        {/* Right content — hidden on mobile when no section selected */}
        <div className={`flex-1 min-w-0 ${!activeSectionId ? 'hidden md:block' : 'block'}`}>
          <button
            onClick={() => setActiveSectionId('')}
            className="md:hidden flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-4 transition-colors border-none bg-transparent cursor-pointer"
          >
            <ChevronLeft size={16} />
            Settings
          </button>

          {activeSection && (
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
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
