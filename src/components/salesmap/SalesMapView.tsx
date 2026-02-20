import { useState, useMemo } from 'react';
import { ShoppingBag, Globe, DollarSign } from 'lucide-react';
import { PageSection } from '@/components/layout/PageSection';
import { KpiCard } from '@/components/kpi/KpiCard';
import { useSalesOrders } from '@/hooks/useSalesOrders';
import { statsByUsState, statsByCountry } from '@/lib/salesMapData';
import { SalesMapUpload } from './SalesMapUpload';
import { UsMap } from './UsMap';
import { WorldMap } from './WorldMap';
import { SalesBreakdownTables } from './SalesBreakdownTables';

type MapView = 'us' | 'world';

function extractYear(saleDate: string): string {
  const yr = saleDate.split('/')[2] ?? '';
  return yr.length === 2 ? `20${yr}` : yr;
}

interface SalesMapViewProps {
  isDark: boolean;
}

export function SalesMapView({ isDark }: SalesMapViewProps) {
  const { orders, merge, clear } = useSalesOrders();
  const [mapView, setMapView] = useState<MapView>('us');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  const availableYears = useMemo(() => {
    const years = new Set(orders.map((o) => extractYear(o.saleDate)).filter(Boolean));
    return [...years].sort().reverse();
  }, [orders]);

  const filteredOrders = useMemo(
    () => (selectedYear === 'all' ? orders : orders.filter((o) => extractYear(o.saleDate) === selectedYear)),
    [orders, selectedYear]
  );

  const stateStats = useMemo(() => statsByUsState(filteredOrders), [filteredOrders]);
  const countryStats = useMemo(() => statsByCountry(filteredOrders), [filteredOrders]);
  const totalRevenue = useMemo(
    () => filteredOrders.reduce((sum, o) => sum + o.orderValue, 0),
    [filteredOrders]
  );

  return (
    <>
      <PageSection title="Upload">
        <SalesMapUpload onMerge={merge} onClear={clear} totalOrders={orders.length} />
      </PageSection>

      {orders.length > 0 ? (
        <>
          {availableYears.length > 1 && (
            <PageSection title="Filter by Year">
              <div className="flex flex-wrap gap-2">
                {(['all', ...availableYears] as const).map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setSelectedYear(yr)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border-none ${
                      selectedYear === yr
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {yr === 'all' ? 'All Years' : yr}
                  </button>
                ))}
              </div>
            </PageSection>
          )}

          <PageSection title="Summary">
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <KpiCard
                label="Total Orders"
                value={filteredOrders.length.toLocaleString()}
                icon={<ShoppingBag size={18} />}
                accent="blue"
              />
              <KpiCard
                label="Total Revenue"
                value={`$${totalRevenue.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
                icon={<DollarSign size={18} />}
                accent="green"
              />
              <KpiCard
                label="Countries"
                value={countryStats.length}
                icon={<Globe size={18} />}
                accent="blue"
              />
            </div>
          </PageSection>

          <PageSection title="Map">
            <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-4 shadow-sm">
              <div className="flex gap-2 mb-4">
                {(['us', 'world'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setMapView(v)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border-none ${
                      mapView === v
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {v === 'us' ? 'US States' : 'World'}
                  </button>
                ))}
              </div>
              {mapView === 'us' ? (
                <UsMap stats={stateStats} isDark={isDark} />
              ) : (
                <WorldMap stats={countryStats} isDark={isDark} />
              )}
            </div>
          </PageSection>

          <PageSection title="Breakdown">
            <SalesBreakdownTables countryStats={countryStats} stateStats={stateStats} />
          </PageSection>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
          <Globe size={48} className="mb-4 opacity-30" />
          <p className="text-base font-medium">No sales data yet</p>
          <p className="text-sm mt-1">Upload an Etsy sold-orders CSV above to get started</p>
        </div>
      )}
    </>
  );
}
