'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Toggle({ checked, onChange, disabled, className }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-electric-blue focus:ring-offset-2 focus:ring-offset-transparent',
        checked
          ? 'bg-electric-blue'
          : 'bg-gray-700/50 border border-gray-600/50',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white transition-transform',
          checked ? 'translate-x-8' : 'translate-x-1'
        )}
      />
      {!checked && (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">
          0
        </span>
      )}
    </button>
  );
}

