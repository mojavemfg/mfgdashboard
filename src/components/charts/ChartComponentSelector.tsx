import type { ComponentWithMetrics } from '@/types';

interface ChartComponentSelectorProps {
  components: ComponentWithMetrics[];
  selectedId: string;
  onChange: (id: string) => void;
}

export function ChartComponentSelector({ components, selectedId, onChange }: ChartComponentSelectorProps) {
  return (
    <select
      value={selectedId}
      onChange={(e) => onChange(e.target.value)}
      className="flex-1 sm:flex-none bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-slate-300 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/60 transition-colors min-w-0"
    >
      {components.map((c) => (
        <option key={c.id} value={c.id}>{c.id} — {c.name}</option>
      ))}
    </select>
  );
}
