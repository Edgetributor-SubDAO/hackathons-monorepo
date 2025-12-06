'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { Home, BarChart3, History } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/status', label: 'Status', icon: BarChart3 },
    { href: '/history', label: 'History', icon: History },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-lg border-t border-white/10 md:hidden">
      <div className="flex items-center justify-around px-4 py-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all',
              pathname === item.href
                ? 'text-white glass-button'
                : 'text-gray-400 hover:text-white'
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

