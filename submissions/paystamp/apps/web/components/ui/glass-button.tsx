import { cn } from '@/lib/utils/cn';
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  glow?: 'none' | 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  loading?: boolean;
}

export function GlassButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  glow = 'blue',
  loading = false,
  disabled,
  ...props
}: GlassButtonProps) {
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-base rounded-xl',
    lg: 'px-8 py-4 text-lg rounded-xl',
  };

  const variantStyles = {
    primary: 'glass-button text-white font-semibold',
    secondary: 'glass-button border-2 text-white font-medium',
    icon: 'glass-button p-3 rounded-full aspect-square flex items-center justify-center',
  };

  const glowStyles = {
    none: '',
    blue: 'hover:shadow-glow-blue',
    green: 'hover:shadow-glow-green',
    red: 'hover:shadow-glow-red',
    yellow: 'hover:shadow-glow-yellow',
    purple: 'hover:shadow-glow-purple',
  };

  return (
    <button
      className={cn(
        variantStyles[variant],
        sizeStyles[size],
        glowStyles[glow],
        'transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none',
        loading && 'cursor-wait',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

