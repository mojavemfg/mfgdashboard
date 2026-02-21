import { LayoutDashboard, PackageSearch, ShoppingCart, LayoutList, Tag, Map, Calculator, Settings } from 'lucide-react';
import type { View } from '@/App';

interface BottomNavProps {
  activeView: View;
  onViewChange: (view: View) => void;
}

const navItems: { id: View; label: string; Icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'dashboard', label: 'Home',      Icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory', Icon: PackageSearch },
  { id: 'orders',    label: 'Orders',    Icon: ShoppingCart },
  { id: 'listings',  label: 'Listings',  Icon: LayoutList },
  { id: 'seo',       label: 'SEO',       Icon: Tag },
  { id: 'salesmap',  label: 'Sales',     Icon: Map },
  { id: 'margin',    label: 'Margin',    Icon: Calculator },
  { id: 'settings',  label: 'Settings',  Icon: Settings },
];

export function BottomNav({ activeView, onViewChange }: BottomNavProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex bg-[var(--color-bg)] border-t border-[var(--color-border)]">
      {navItems.map(({ id, label, Icon }) => {
        const active = activeView === id;
        return (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            className={[
              'flex-1 flex flex-col items-center justify-center gap-0.5 py-2',
              'transition-colors duration-150 cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-inset',
              'focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]',
              active
                ? 'text-[var(--color-brand)]'
                : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]',
            ].join(' ')}
          >
            <Icon size={18} />
            <span className="text-[9px] font-medium">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
