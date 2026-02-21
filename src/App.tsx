import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Dashboard } from '@/pages/Dashboard';
import { ToastProvider } from '@/components/ui/Toast';
import { useInventoryMetrics } from '@/hooks/useInventoryMetrics';
import { useTheme } from '@/hooks/useTheme';
import { useSalesOrders } from '@/hooks/useSalesOrders';
import { usePrintInventory } from '@/hooks/usePrintInventory';
import { useSettings } from '@/hooks/useSettings';
import { useSidebar } from '@/hooks/useSidebar';

export type View = 'dashboard' | 'inventory' | 'orders' | 'listings' | 'seo' | 'salesmap' | 'margin' | 'settings';

const viewTitles: Record<View, string> = {
  dashboard: 'Dashboard',
  inventory: 'Inventory',
  orders:    'Order History',
  listings:  'Listings',
  seo:       'Etsy SEO',
  salesmap:  'Sales Map',
  margin:    'Margin Calculator',
  settings:  'Settings',
};

function App() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const sidebar = useSidebar(activeView);

  const { criticalCount } = useInventoryMetrics();
  const { isDark, toggle } = useTheme();
  const { orders: salesOrders, merge: mergeSalesOrders, clear: clearSalesOrders } = useSalesOrders();
  const { settings, update: updateSettings } = useSettings();
  const {
    enriched: printEnriched,
    upsert: upsertPrintItem,
    remove: removePrintItem,
    kpis: printKpis,
  } = usePrintInventory(
    settings.inventory.criticalMultiplier,
    settings.inventory.warningMultiplier,
  );

  return (
    <ToastProvider>
      <div className="h-dvh flex flex-col bg-[var(--color-bg)] text-[var(--color-text-primary)] overflow-hidden">
        <Header
          criticalCount={criticalCount}
          isDark={isDark}
          onThemeToggle={toggle}
          pageTitle={viewTitles[activeView]}
          onMobileMenuOpen={sidebar.open}
          onNavigate={setActiveView}
        />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            activeView={activeView}
            onViewChange={setActiveView}
            mobileOpen={sidebar.isOpen}
            onMobileClose={sidebar.close}
          />
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
            onThemeToggle={toggle}
            settings={settings}
            updateSettings={updateSettings}
          />
        </div>
      </div>
    </ToastProvider>
  );
}

export default App;
