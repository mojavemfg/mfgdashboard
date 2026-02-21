import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Dashboard } from '@/pages/Dashboard';
import { useInventoryMetrics } from '@/hooks/useInventoryMetrics';
import { useTheme } from '@/hooks/useTheme';
import { useSalesOrders } from '@/hooks/useSalesOrders';
import { usePrintInventory } from '@/hooks/usePrintInventory';

export type View = 'dashboard' | 'inventory' | 'orders' | 'listings' | 'seo' | 'salesmap' | 'margin';

function App() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const { criticalCount } = useInventoryMetrics();
  const { isDark, toggle } = useTheme();
  const { orders: salesOrders, merge: mergeSalesOrders, clear: clearSalesOrders } = useSalesOrders();
  const { enriched: printEnriched, upsert: upsertPrintItem, remove: removePrintItem, kpis: printKpis } = usePrintInventory();

  return (
    <div className="h-dvh flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white overflow-hidden">
      <Header criticalCount={criticalCount} isDark={isDark} onThemeToggle={toggle} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
        <Dashboard
          activeView={activeView}
          isDark={isDark}
          salesOrders={salesOrders}
          onMergeSalesOrders={mergeSalesOrders}
          onClearSalesOrders={clearSalesOrders}
          onNavigate={setActiveView}
          printKpis={printKpis}
          printEnriched={printEnriched}
          onUpsertPrintItem={upsertPrintItem}
          onRemovePrintItem={removePrintItem}
        />
      </div>
      <BottomNav activeView={activeView} onViewChange={setActiveView} />
    </div>
  );
}

export default App;
