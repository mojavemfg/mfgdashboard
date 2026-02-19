import { Factory, Bell } from 'lucide-react';

interface HeaderProps {
  criticalCount: number;
}

export function Header({ criticalCount }: HeaderProps) {
  return (
    <header className="bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Factory className="text-blue-400" size={28} />
        <div>
          <h1 className="text-white font-bold text-xl leading-tight">MFG Ops Dashboard</h1>
          <p className="text-slate-400 text-xs">Manufacturing Operations &amp; Inventory Control</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-slate-400 text-sm">Feb 19, 2026</span>
        {criticalCount > 0 && (
          <div className="relative">
            <Bell className="text-red-400" size={22} />
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {criticalCount}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
