import { cn } from '@/lib/utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeStyles = {
    sm: 'w-5 h-5 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div
      className={cn(
        'border-white border-t-transparent rounded-full animate-spin',
        sizeStyles[size],
        className
      )}
    />
  );
}

interface SkeletonLoaderProps {
  className?: string;
  lines?: number;
}

export function SkeletonLoader({ className, lines = 1 }: SkeletonLoaderProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="glass h-4 rounded animate-pulse"
          style={{
            background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s linear infinite',
          }}
        />
      ))}
    </div>
  );
}

interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({ progress, className, showLabel = false }: ProgressBarProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="glass h-2 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-electric-blue to-electric-purple transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-sm text-gray-300 mt-1 text-right">{progress}%</p>
      )}
    </div>
  );
}

