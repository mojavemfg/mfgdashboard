import { LayoutDashboard, PackageSearch, ShoppingCart, BarChart2, Tag, Map, Calculator } from 'lucide-react';
import type { View } from '@/App';

interface BottomNavProps {
  activeView: View;
  onViewChange: (view: View) => void;
}

const navItems: { id: View; label: string; Icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory', Icon: PackageSearch },
  { id: 'orders', label: 'Orders', Icon: ShoppingCart },
  { id: 'charts', label: 'Analytics', Icon: BarChart2 },
  { id: 'seo', label: 'Etsy SEO', Icon: Tag },
  { id: 'salesmap', label: 'Sales Map', Icon: Map },
  { id: 'margin', label: 'Margin', Icon: Calculator },
];

export function BottomNav({ activeView, onViewChange }: BottomNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-700/60 flex">
      {navItems.map(({ id, label, Icon }) => {
        const active = activeView === id;
        const isSeo = id === 'seo';
        const isMargin = id === 'margin';
        return (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors cursor-pointer border-none bg-transparent ${
              active
                ? isSeo ? 'text-orange-500 dark:text-orange-400'
                : isMargin ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-blue-600 dark:text-blue-400'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <Icon size={19} />
            <span className="text-[9px] font-medium">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
