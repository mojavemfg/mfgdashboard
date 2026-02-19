import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Dashboard } from '@/pages/Dashboard';
import { useInventoryMetrics } from '@/hooks/useInventoryMetrics';

type View = 'dashboard' | 'inventory' | 'orders' | 'charts';

function App() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const { criticalCount } = useInventoryMetrics();

  return (
    <div className="h-dvh flex flex-col bg-slate-950 text-white overflow-hidden">
      <Header criticalCount={criticalCount} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
        <Dashboard activeView={activeView} />
      </div>
      <BottomNav activeView={activeView} onViewChange={setActiveView} />
    </div>
  );
}

export default App;
