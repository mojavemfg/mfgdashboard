import { useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import type { RegionStat } from '@/lib/salesMapData';
import { STATE_ABBR_TO_NAME } from '@/lib/geoLookup';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

function buildNameMap(stats: RegionStat[]): Map<string, RegionStat> {
  const m = new Map<string, RegionStat>();
  for (const stat of stats) {
    const name = STATE_ABBR_TO_NAME[stat.key];
    if (name) m.set(name, stat);
  }
  return m;
}

function choroplethColor(count: number, max: number, isDark: boolean): string {
  if (count === 0 || max === 0) return isDark ? '#1e293b' : '#e2e8f0';
  const t = count / max;
  // Interpolate blue-200 (#bfdbfe) → blue-700 (#1d4ed8)
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

interface UsMapProps {
  stats: RegionStat[];
  isDark: boolean;
}

export function UsMap({ stats, isDark }: UsMapProps) {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const nameMap = buildNameMap(stats);
  const max = Math.max(...stats.map((s) => s.count), 1);
  const strokeColor = isDark ? '#334155' : '#ffffff';

  return (
    <div className="relative w-full">
      <ComposableMap
        projection="geoAlbersUsa"
        projectionConfig={{ scale: 1000 }}
        style={{ width: '100%', height: 'auto' }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const name = geo.properties.name as string;
              const stat = nameMap.get(name);
              const count = stat?.count ?? 0;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={choroplethColor(count, max, isDark)}
                  stroke={strokeColor}
                  strokeWidth={0.5}
                  style={{ outline: 'none' }}
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
          className="fixed z-50 pointer-events-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 shadow-lg text-sm"
          style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
        >
          <p className="font-semibold text-slate-900 dark:text-white">{tooltip.name}</p>
          <p className="text-slate-500 dark:text-slate-400">
            {tooltip.count} {tooltip.count === 1 ? 'order' : 'orders'} · ${tooltip.revenue.toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
}
