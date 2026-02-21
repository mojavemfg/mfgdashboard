import { LayoutDashboard, PackageSearch, ShoppingCart, LayoutList, Tag, Map, Calculator, Settings } from 'lucide-react';
import type { View } from '@/App';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
}

const mainNavItems: { id: View; label: string; Icon: React.ComponentType<{ size?: number; className?: string }>; accent?: string }[] = [
  { id: 'dashboard', label: 'Dashboard',    Icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory',    Icon: PackageSearch },
  { id: 'orders',    label: 'Order History', Icon: ShoppingCart },
  { id: 'listings',  label: 'Listings',     Icon: LayoutList },
  { id: 'seo',       label: 'Etsy SEO',     Icon: Tag,        accent: 'orange' },
  { id: 'salesmap',  label: 'Sales Map',    Icon: Map },
  { id: 'margin',    label: 'Margin Calc',  Icon: Calculator, accent: 'emerald' },
];

function NavButton({ id, label, Icon, accent, active, onClick }: {
  id: View; label: string; Icon: React.ComponentType<{ size?: number; className?: string }>;
  accent?: string; active: boolean; onClick: () => void;
}) {
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
      onClick={onClick}
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
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <nav className="hidden md:flex w-52 bg-white dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-700/60 flex-col pt-3 pb-4 shrink-0 px-2">
      <div className="flex-1 flex flex-col gap-0.5">
        {mainNavItems.map(({ id, label, Icon, accent }) => (
          <NavButton key={id} id={id} label={label} Icon={Icon} accent={accent}
            active={activeView === id} onClick={() => onViewChange(id)} />
        ))}
      </div>
      <div className="border-t border-slate-200 dark:border-slate-700/60 pt-2 mt-2">
        <NavButton id="settings" label="Settings" Icon={Settings}
          active={activeView === 'settings'} onClick={() => onViewChange('settings')} />
      </div>
    </nav>
  );
}
