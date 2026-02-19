import type { ReorderStatus } from '@/types';

interface StatusBadgeProps {
  status: ReorderStatus;
}

const map: Record<ReorderStatus, string> = {
  Critical: 'bg-red-500/20 text-red-400 border border-red-600',
  Warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-600',
  OK: 'bg-green-500/20 text-green-400 border border-green-700',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${map[status]}`}>{status}</span>
  );
}
