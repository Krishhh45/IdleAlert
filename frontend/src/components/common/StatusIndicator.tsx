import React from 'react';
import { SystemStatus } from '../../types';

interface StatusIndicatorProps {
  status: SystemStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  pulse?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'md',
  showLabel = false,
  pulse = true
}) => {
  const normStatus = (status || 'Unknown').toLowerCase();

  const getColors = () => {
    switch (normStatus) {
      case 'normal':
        return {
          dot: 'bg-emerald-500',
          ring: 'bg-emerald-400',
          text: 'text-emerald-400',
          label: 'Normal',
          emoji: '🟢'
        };
      case 'warning':
        return {
          dot: 'bg-amber-500',
          ring: 'bg-amber-400',
          text: 'text-amber-400',
          label: 'Warning',
          emoji: '🟡'
        };
      case 'critical':
        return {
          dot: 'bg-rose-500',
          ring: 'bg-rose-400',
          text: 'text-rose-400',
          label: 'Critical',
          emoji: '🔴'
        };
      default:
        return {
          dot: 'bg-slate-400',
          ring: 'bg-slate-300',
          text: 'text-slate-400',
          label: 'Unknown',
          emoji: '⚪'
        };
    }
  };

  const { dot, ring, text, label, emoji } = getColors();

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3.5 h-3.5'
  };

  return (
    <div className="inline-flex items-center gap-2">
      <span className="relative flex shrink-0 items-center justify-center">
        {pulse && (normStatus === 'critical' || normStatus === 'warning') && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${ring}`}
          />
        )}
        <span className={`relative inline-flex rounded-full ${dot} ${sizeClasses[size]}`} />
      </span>
      {showLabel && (
        <span className={`text-xs font-semibold uppercase tracking-wider ${text}`}>
          {label}
        </span>
      )}
    </div>
  );
};
