import { StatusBadge } from '../common/StatusBadge';
import type { StockStatus } from '../../types/domain';

const labels: Record<StockStatus, string> = {
  verified: 'Verificado',
  discrepancy: 'Discrepancia',
  pending: 'Pendiente',
};

export function StockStatusBadge({ status }: { status: StockStatus }) {
  const tone = status === 'verified' ? 'success' : status === 'discrepancy' ? 'danger' : 'warning';
  return <StatusBadge tone={tone}>{labels[status]}</StatusBadge>;
}

