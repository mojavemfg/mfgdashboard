interface KpiCardProps {
  label: string;
  value: string | number;
  trend?: { value: string; positive: boolean };
  sub?: string;
}

export function KpiCard({ label, value, trend, sub }: KpiCardProps) {
  return (
    <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4">
      <p className="text-xs font-medium text-[var(--color-text-tertiary)] mb-1">{label}</p>
      <p className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)] leading-none">
        {value}
      </p>
      {trend && (
        <p className={`text-xs mt-1.5 flex items-center gap-1 ${trend.positive ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
          <span>{trend.positive ? '↑' : '↓'}</span>
          {trend.value}
        </p>
      )}
      {sub && (
        <p className="text-xs text-[var(--color-text-tertiary)] mt-1">{sub}</p>
      )}
    </div>
  );
}
