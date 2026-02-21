import type { ReorderStatus } from '@/types';
import { Badge } from '@/components/ui/Badge';

interface StatusBadgeProps {
  status: ReorderStatus;
}

const variantMap: Record<ReorderStatus, 'danger' | 'warning' | 'success'> = {
  Critical: 'danger',
  Warning:  'warning',
  OK:       'success',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge variant={variantMap[status]}>{status}</Badge>;
}
