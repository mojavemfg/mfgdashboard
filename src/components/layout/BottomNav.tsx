import { LayoutDashboard, PackageSearch, ShoppingCart, BarChart2 } from 'lucide-react';

type View = 'dashboard' | 'inventory' | 'orders' | 'charts';

interface BottomNavProps {
  activeView: View;
  onViewChange: (view: View) => void;
}

const navItems: { id: View; label: string; Icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory', Icon: PackageSearch },
  { id: 'orders', label: 'Orders', Icon: ShoppingCart },
  { id: 'charts', label: 'Analytics', Icon: BarChart2 },
];

export function BottomNav({ activeView, onViewChange }: BottomNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur border-t border-slate-700/60 flex">
      {navItems.map(({ id, label, Icon }) => {
        const active = activeView === id;
        return (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors cursor-pointer border-none bg-transparent ${
              active ? 'text-blue-400' : 'text-slate-500'
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
