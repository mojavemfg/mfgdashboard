import { Store, Printer, BadgeDollarSign, Bell, Palette, Database } from 'lucide-react';

export interface SettingsSection {
  id: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: 'shop-profile',       label: 'Shop Profile',       Icon: Store },
  { id: 'printing',           label: 'Printing Defaults',  Icon: Printer },
  { id: 'etsy-fees',          label: 'Etsy Fees',          Icon: BadgeDollarSign },
  { id: 'inventory-alerts',   label: 'Inventory Alerts',   Icon: Bell },
  { id: 'appearance',         label: 'Appearance',         Icon: Palette },
  { id: 'data-management',    label: 'Data Management',    Icon: Database },
];

interface SettingsNavProps {
  activeSectionId: string;
  onSelect: (id: string) => void;
}

export function SettingsNav({ activeSectionId, onSelect }: SettingsNavProps) {
  return (
    <nav className="flex flex-col gap-0.5">
      {SETTINGS_SECTIONS.map(({ id, label, Icon }) => {
        const active = activeSectionId === id;
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all text-left w-full cursor-pointer border-none rounded-xl ${
              active
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Icon size={17} className={active ? 'text-blue-100' : ''} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
