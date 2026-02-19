import { LayoutDashboard, PackageSearch, ShoppingCart, BarChart2 } from 'lucide-react';

type View = 'dashboard' | 'inventory' | 'orders' | 'charts';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
}

const navItems: { id: View; label: string; Icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory', Icon: PackageSearch },
  { id: 'orders', label: 'Purchase Orders', Icon: ShoppingCart },
  { id: 'charts', label: 'Analytics', Icon: BarChart2 },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <nav className="hidden md:flex w-52 bg-white dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-700/60 flex-col pt-3 pb-4 shrink-0 gap-0.5 px-2">
      {navItems.map(({ id, label, Icon }) => {
        const active = activeView === id;
        return (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all text-left w-full cursor-pointer border-none rounded-lg ${
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
