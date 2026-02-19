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
      className="bg-slate-800 border border-slate-600 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
    >
      {components.map((c) => (
        <option key={c.id} value={c.id}>
          {c.id} — {c.name}
        </option>
      ))}
    </select>
  );
}
