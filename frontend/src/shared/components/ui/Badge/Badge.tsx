import React from 'react';
import { clsx } from 'clsx';
import { STATUS_COLORS, STATUS_LABELS } from '../../../constants';

interface BadgeProps {
  status?: string;
  variant?: 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'purple';
  children?: React.ReactNode;
  className?: string;
}

const variantMap = {
  green: 'badge-green',
  red: 'badge-red',
  yellow: 'badge-yellow',
  blue: 'badge-blue',
  gray: 'badge-gray',
  purple: 'badge bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

export function Badge({ status, variant, children, className }: BadgeProps): React.JSX.Element {
  const resolvedVariant = status
    ? (STATUS_COLORS[status] ?? 'badge-gray')
    : variant
      ? variantMap[variant]
      : 'badge-gray';

  return (
    <span className={clsx(resolvedVariant, className)}>
      {children ?? (status ? (STATUS_LABELS[status] ?? status) : null)}
    </span>
  );
}
