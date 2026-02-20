import { LayoutDashboard, PackageSearch, ShoppingCart, LayoutList, Tag, Map, Calculator } from 'lucide-react';
import type { View } from '@/App';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
}

const navItems: { id: View; label: string; Icon: React.ComponentType<{ size?: number; className?: string }>; accent?: string }[] = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory', Icon: PackageSearch },
  { id: 'orders', label: 'Order History', Icon: ShoppingCart },
  { id: 'listings', label: 'Listings', Icon: LayoutList },
  { id: 'seo', label: 'Etsy SEO', Icon: Tag, accent: 'orange' },
  { id: 'salesmap', label: 'Sales Map', Icon: Map },
  { id: 'margin', label: 'Margin Calc', Icon: Calculator, accent: 'emerald' },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <nav className="hidden md:flex w-52 bg-white dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-700/60 flex-col pt-3 pb-4 shrink-0 gap-0.5 px-2">
      {navItems.map(({ id, label, Icon, accent }) => {
        const active = activeView === id;
        const activeBg =
          accent === 'orange'  ? 'bg-orange-500 text-white shadow-lg shadow-orange-900/20' :
          accent === 'emerald' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' :
                                 'bg-blue-600 text-white shadow-lg shadow-blue-900/20';
        const activeIconCls =
          accent === 'orange'  ? 'text-orange-100' :
          accent === 'emerald' ? 'text-emerald-100' :
                                 'text-blue-100';
        return (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all text-left w-full cursor-pointer border-none rounded-lg ${
              active
                ? activeBg
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Icon size={17} className={active ? activeIconCls : ''} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
