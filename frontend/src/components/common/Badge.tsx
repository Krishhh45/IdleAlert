import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = ''
}) => {
  const variantStyles = {
    primary: 'bg-brand-950/80 text-brand-300 border-brand-700/40',
    success: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/40',
    warning: 'bg-amber-950/70 text-amber-300 border-amber-700/40',
    danger: 'bg-rose-950/70 text-rose-300 border-rose-700/40',
    neutral: 'bg-slate-800/80 text-slate-300 border-slate-700/50',
    outline: 'bg-transparent text-slate-400 border-slate-700'
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1'
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border shadow-sm tracking-wide ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};
