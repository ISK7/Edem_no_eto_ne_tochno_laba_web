import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  text: string;
  action?: ReactNode;
}

export function EmptyState({ icon = 'car', title, text, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">
        <Icon name={icon} size={26} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
