import { cn } from '@/lib/utils/cn';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  variant?: 'default' | 'large' | 'small';
  glow?: 'none' | 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}

export function GlassCard({
  children,
  className,
  hover = true,
  variant = 'default',
  glow = 'none',
}: GlassCardProps) {
  const variantStyles = {
    small: 'p-4 rounded-xl',
    default: 'p-6 md:p-8 rounded-2xl',
    large: 'p-8 md:p-12 rounded-3xl',
  };

  const glowStyles = {
    none: '',
    blue: 'shadow-glow-blue',
    green: 'shadow-glow-green',
    red: 'shadow-glow-red',
    yellow: 'shadow-glow-yellow',
    purple: 'shadow-glow-purple',
  };

  return (
    <div
      className={cn(
        'glass',
        variantStyles[variant],
        hover && 'glass-hover cursor-pointer',
        glowStyles[glow],
        'shadow-glass',
        className
      )}
    >
      {children}
    </div>
  );
}

