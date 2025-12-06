import { cn } from '@/lib/utils/cn';
import { CheckCircle2, AlertTriangle, XCircle, Info, Circle } from 'lucide-react';

type StatusType = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface StatusBadgeProps {
  status: StatusType;
  children: React.ReactNode;
  variant?: 'dot' | 'text' | 'icon';
  icon?: React.ReactNode;
  className?: string;
}

export function StatusBadge({
  status,
  children,
  variant = 'icon',
  icon,
  className,
}: StatusBadgeProps) {
  const statusStyles = {
    success: 'bg-status-success/20 text-status-success border-status-success/30 shadow-glow-green',
    warning: 'bg-status-warning/20 text-status-warning border-status-warning/30 shadow-glow-yellow',
    error: 'bg-status-error/20 text-status-error border-status-error/30 shadow-glow-red',
    info: 'bg-status-info/20 text-status-info border-status-info/30 shadow-glow-blue',
    neutral: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  };

  const defaultIcons = {
    success: CheckCircle2,
    warning: AlertTriangle,
    error: XCircle,
    info: Info,
    neutral: Circle,
  };

  const IconComponent = defaultIcons[status];

  return (
    <span
      className={cn(
        'glass inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border',
        statusStyles[status],
        className
      )}
    >
      {variant !== 'text' && (
        <span className="flex items-center">
          {icon || <IconComponent className="w-3 h-3" />}
        </span>
      )}
      {variant !== 'dot' && <span>{children}</span>}
    </span>
  );
}

