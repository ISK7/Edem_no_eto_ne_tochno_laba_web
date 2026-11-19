import type { RequestStatus } from '../types';
import { STATUS_LABELS } from '../types';

const toneClass: Record<RequestStatus, string> = {
  PENDING: 'badge--pending',
  APPROVED: 'badge--approved',
  COMPLETED: 'badge--completed',
  REJECTED: 'badge--rejected',
};

interface StatusBadgeProps {
  status: RequestStatus;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span className={`badge ${toneClass[status]} ${className}`.trim()}>
      <span className="badge__dot" aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}
