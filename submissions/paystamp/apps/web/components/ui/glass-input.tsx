import { cn } from '@/lib/utils/cn';
import { InputHTMLAttributes, forwardRef } from 'react';

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  icon?: React.ReactNode;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ label, error, success, icon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-200 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'glass-input w-full px-4 py-3 rounded-xl text-white placeholder:text-gray-400',
              icon && 'pl-10',
              error && 'border-red-500 shadow-glow-red',
              success && 'border-green-500 shadow-glow-green',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
            <span>⚠</span>
            {error}
          </p>
        )}
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';

