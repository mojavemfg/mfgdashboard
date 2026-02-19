import type { ReorderStatus } from '@/types';

interface StatusBadgeProps {
  status: ReorderStatus;
}

const map: Record<ReorderStatus, string> = {
  Critical: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/40',
  Warning: 'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/40',
  OK: 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-600/40',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${map[status]}`}>{status}</span>
  );
}
