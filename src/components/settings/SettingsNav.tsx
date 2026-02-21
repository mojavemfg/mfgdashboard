import { Store, Printer, BadgeDollarSign, Bell, Palette, Database } from 'lucide-react';

export interface SettingsSection {
  id: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: 'shop-profile',     label: 'Shop Profile',      Icon: Store },
  { id: 'printing',         label: 'Printing Defaults', Icon: Printer },
  { id: 'etsy-fees',        label: 'Etsy Fees',         Icon: BadgeDollarSign },
  { id: 'inventory-alerts', label: 'Inventory Alerts',  Icon: Bell },
  { id: 'appearance',       label: 'Appearance',        Icon: Palette },
  { id: 'data-management',  label: 'Data Management',   Icon: Database },
];

interface SettingsNavProps {
  activeSectionId: string;
  onSelect: (id: string) => void;
}

export function SettingsNav({ activeSectionId, onSelect }: SettingsNavProps) {
  return (
    <nav className="flex flex-col gap-0.5 w-[180px]">
      {SETTINGS_SECTIONS.map(({ id, label, Icon }) => {
        const active = activeSectionId === id;
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={[
              'flex items-center gap-2.5 w-full px-3 h-[30px] text-sm font-medium text-left',
              'rounded-[var(--radius-md)] transition-colors duration-150 cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]',
              active
                ? 'bg-[var(--color-bg-muted)] text-[var(--color-text-primary)]'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-primary)]',
            ].join(' ')}
          >
            <Icon
              size={15}
              className={active ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]'}
            />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
