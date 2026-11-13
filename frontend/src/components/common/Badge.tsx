import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
}) => {
  const variantStyles = {
    primary: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    secondary: 'bg-teal-50 text-teal-700 border-teal-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs font-medium px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'neutral';

  switch (status) {
    case 'Selected':
    case 'Active':
      variant = 'success';
      break;
    case 'Shortlisted':
      variant = 'secondary';
      break;
    case 'Under Review':
    case 'Under Manager Review':
    case 'Processing':
    case 'Queued':
      variant = 'primary';
      break;
    case 'Assigned':
    case 'Screened':
    case 'Interview Scheduled':
      variant = 'info';
      break;
    case 'Needs Review':
    case 'On Hold':
    case 'Pending':
      variant = 'warning';
      break;
    case 'Rejected':
    case 'Failed':
    case 'Inactive':
      variant = 'danger';
      break;
    default:
      variant = 'neutral';
  }

  return <Badge variant={variant}>{status}</Badge>;
};

export const ClassificationBadge: React.FC<{ classification?: string | null }> = ({
  classification,
}) => {
  if (!classification) return null;

  let color = 'bg-slate-100 text-slate-700 border-slate-300';
  if (classification.includes('IT')) {
    color = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (classification.includes('Advocate')) {
    color = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (classification.includes('Field')) {
    color = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${color}`}>
      {classification}
    </span>
  );
};

