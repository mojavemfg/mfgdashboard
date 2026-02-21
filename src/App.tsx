import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import type { NotificationAlert } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Dashboard } from '@/pages/Dashboard';
import { ToastProvider } from '@/components/ui/Toast';
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

  // Build notification alerts from visible inventory sources only
  const alerts = useMemo<NotificationAlert[]>(() => {
    const list: NotificationAlert[] = [];

    // Critical print inventory
    for (const p of printEnriched.filter(p => p.status === 'Critical')) {
      list.push({
        id: `print-crit-${p.id}`,
        severity: 'critical',
        title: p.name,
        detail: `${p.currentStock} ${p.unit} in stock · safety: ${p.safetyStock} ${p.unit}`,
        view: 'inventory',
      });
    }

    // Warning print inventory
    for (const p of printEnriched.filter(p => p.status === 'Warning')) {
      list.push({
        id: `print-warn-${p.id}`,
        severity: 'warning',
        title: p.name,
        detail: `${p.currentStock} ${p.unit} in stock · safety: ${p.safetyStock} ${p.unit}`,
        view: 'inventory',
      });
    }

    // Unshipped orders (deduplicated by orderId)
    const unshippedOrderIds = new Set(
      salesOrders.filter(o => !o.dateShipped).map(o => o.orderId)
    );
    if (unshippedOrderIds.size > 0) {
      list.push({
        id: 'unshipped-orders',
        severity: 'info',
        title: `${unshippedOrderIds.size} unshipped order${unshippedOrderIds.size === 1 ? '' : 's'}`,
        detail: 'Pending fulfillment',
        view: 'orders',
      });
    }

    return list;
  }, [printEnriched, salesOrders]);

  return (
    <ToastProvider>
      <div className="h-dvh flex flex-col bg-[var(--color-bg)] text-[var(--color-text-primary)] overflow-hidden">
        <Header
          alerts={alerts}
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
