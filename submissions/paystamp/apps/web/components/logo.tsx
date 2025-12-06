import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textSize?: 'sm' | 'md' | 'lg';
}

const textSizeMap = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
};

export function Logo({ className, size = 32, showText = false, textSize = 'md' }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <Image
          src="/logo.png"
          alt="PayStamp Logo"
          width={size}
          height={size}
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <span className={cn('font-display font-extrabold text-gradient-glow', textSizeMap[textSize])}>
          PayStamp
        </span>
      )}
    </div>
  );
}

