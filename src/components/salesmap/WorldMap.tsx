import { useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import type { RegionStat } from '@/lib/salesMapData';
import { normalizeCountry } from '@/lib/geoLookup';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

function buildCountryMap(stats: RegionStat[]): Map<string, RegionStat> {
  const m = new Map<string, RegionStat>();
  for (const stat of stats) {
    m.set(normalizeCountry(stat.key), stat);
  }
  return m;
}

function choroplethColor(count: number, max: number, isDark: boolean): string {
  if (count === 0 || max === 0) return isDark ? '#1e293b' : '#e2e8f0';
  const t = count / max;
  const r = Math.round(191 + t * (29 - 191));
  const g = Math.round(219 + t * (78 - 219));
  const b = Math.round(254 + t * (216 - 254));
  return `rgb(${r},${g},${b})`;
}

interface Tooltip {
  x: number;
  y: number;
  name: string;
  count: number;
  revenue: number;
}

interface WorldMapProps {
  stats: RegionStat[];
  isDark: boolean;
}

export function WorldMap({ stats, isDark }: WorldMapProps) {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const countryMap = buildCountryMap(stats);
  const max = Math.max(...stats.map((s) => s.count), 1);
  const strokeColor = isDark ? '#334155' : '#ffffff';

  return (
    <div className="relative w-full">
      <ComposableMap
        projectionConfig={{ scale: 130 }}
        style={{ width: '100%', height: 'auto' }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const name = geo.properties.name as string;
              const stat = countryMap.get(name);
              const count = stat?.count ?? 0;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={choroplethColor(count, max, isDark)}
                  stroke={strokeColor}
                  strokeWidth={0.3}
                  style={{ default: { outline: 'none' }, hover: { outline: 'none' }, pressed: { outline: 'none' } }}
                  onMouseEnter={(evt) =>
                    setTooltip({ x: evt.clientX, y: evt.clientY, name, count, revenue: stat?.revenue ?? 0 })
                  }
                  onMouseMove={(evt) =>
                    setTooltip((t) => (t ? { ...t, x: evt.clientX, y: evt.clientY } : null))
                  }
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-lg)] px-3 py-2 shadow-[var(--shadow-md)] text-sm"
          style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
        >
          <p className="font-semibold text-[var(--color-text-primary)]">{tooltip.name}</p>
          <p className="text-[var(--color-text-secondary)]">
            {tooltip.count} {tooltip.count === 1 ? 'order' : 'orders'} · ${tooltip.revenue.toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
}
