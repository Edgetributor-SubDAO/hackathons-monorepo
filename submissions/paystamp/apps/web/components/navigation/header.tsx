'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useWalletStore } from '@/stores/wallet-store';
import { GlassButton } from '@/components/ui/glass-button';
import { cn } from '@/lib/utils/cn';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/logo';

export function Header() {
  const pathname = usePathname();
  const { stellarAddress, isStellarConnected } = useWalletStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/status', label: 'Status' },
    { href: '/history', label: 'History' },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 glass transition-all duration-300',
        scrolled ? 'backdrop-blur-glass-lg shadow-glass-lg' : 'backdrop-blur-glass'
      )}
    >
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Logo size={32} showText={true} textSize="md" />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-gray-200 hover:text-white transition-colors relative font-medium',
                pathname === link.href && 'text-white font-semibold'
              )}
            >
              {link.label}
              {pathname === link.href && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-electric-blue via-electric-purple to-electric-pink" />
              )}
            </Link>
          ))}
        </div>

        {/* Wallet Status & Connect Button */}
        <div className="flex items-center gap-4">
          {isStellarConnected && stellarAddress ? (
            <div className="hidden sm:flex items-center gap-2 glass px-4 py-2 rounded-xl">
              <div className="w-2 h-2 bg-status-success rounded-full animate-pulse" />
              <span className="text-sm text-gray-300 font-mono">
                {stellarAddress.slice(0, 6)}...{stellarAddress.slice(-4)}
              </span>
            </div>
          ) : (
            <Link href="/connect">
              <GlassButton size="sm" variant="primary">
                Connect Wallet
              </GlassButton>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden glass-button p-2 rounded-lg"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <Menu className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-lg border-t border-white/10 animate-slide-up">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'text-gray-300 hover:text-white transition-colors py-2',
                  pathname === link.href && 'text-white font-semibold'
                )}
              >
                {link.label}
              </Link>
            ))}
            {!isStellarConnected && (
              <Link href="/connect" onClick={() => setMobileMenuOpen(false)}>
                <GlassButton size="sm" variant="primary" className="w-full">
                  Connect Wallet
                </GlassButton>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

