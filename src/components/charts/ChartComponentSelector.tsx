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
      className="flex-1 sm:flex-none bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm rounded-[var(--radius-md)] px-3 h-8 focus:outline-none focus:border-[var(--color-brand)] focus:shadow-[0_0_0_3px_var(--color-brand-subtle)] transition-[border-color,box-shadow] duration-150 min-w-0"
    >
      {components.map((c) => (
        <option key={c.id} value={c.id}>{c.id} — {c.name}</option>
      ))}
    </select>
  );
}
