import React from 'react';

type StatusVariant = 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed' | 'not_started' | 'enrolled' | 'not_enrolled' | 'info' | 'warning';

const variantClasses: Record<StatusVariant, string> = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  approved: 'bg-green-50 text-green-700 border border-green-200',
  rejected: 'bg-red-50 text-red-700 border border-red-200',
  in_progress: 'bg-blue-50 text-blue-700 border border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  not_started: 'bg-gray-100 text-gray-600 border border-gray-200',
  enrolled: 'bg-secondary-50 text-secondary-600 border border-secondary-400/30',
  not_enrolled: 'bg-gray-100 text-gray-500 border border-gray-200',
  info: 'bg-secondary-50 text-secondary-600 border border-secondary-400/30',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
};

const variantLabels: Record<StatusVariant, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  in_progress: 'In Progress',
  completed: 'Completed',
  not_started: 'Not Started',
  enrolled: 'Enrolled',
  not_enrolled: 'Not Enrolled',
  info: 'Info',
  warning: 'Warning',
};

interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className = '' }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[status]} ${className}`}>
      {label ?? variantLabels[status]}
    </span>
  );
}
