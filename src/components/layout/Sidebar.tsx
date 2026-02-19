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
    <nav className="w-52 bg-slate-900 border-r border-slate-700 flex flex-col pt-4 shrink-0">
      {navItems.map(({ id, label, Icon }) => {
        const active = activeView === id;
        return (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-left w-full cursor-pointer border-none rounded-none ${
              active
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
