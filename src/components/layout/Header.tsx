import { Factory, Bell } from 'lucide-react';

interface HeaderProps {
  criticalCount: number;
}

export function Header({ criticalCount }: HeaderProps) {
  return (
    <header className="bg-slate-900/80 backdrop-blur border-b border-slate-700/60 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="bg-blue-500/20 p-1.5 rounded-lg">
          <Factory className="text-blue-400" size={20} />
        </div>
        <div>
          <h1 className="text-white font-bold text-base sm:text-lg leading-tight tracking-tight">
            MFG Ops
          </h1>
          <p className="text-slate-500 text-[10px] hidden sm:block">Manufacturing Operations</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-slate-500 text-xs hidden sm:block">Feb 19, 2026</span>
        <div className="relative">
          <div className={`p-1.5 rounded-lg ${criticalCount > 0 ? 'bg-red-500/15' : 'bg-slate-800'}`}>
            <Bell className={criticalCount > 0 ? 'text-red-400' : 'text-slate-500'} size={18} />
          </div>
          {criticalCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {criticalCount}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
