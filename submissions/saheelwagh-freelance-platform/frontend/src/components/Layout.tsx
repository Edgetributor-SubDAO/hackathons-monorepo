import { Link, useLocation } from 'react-router-dom';
import { Home, Briefcase, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { StellarWallet } from './StellarWallet';
import { PolkadotWallet } from './PolkadotWallet';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/client', label: 'Client', icon: Briefcase },
    { path: '/freelancer', label: 'Freelancer', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">GV</span>
                </div>
                <span className="text-xl font-bold text-white">GigVault</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors',
                      isActive
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Wallet Connection - Stellar only in header */}
            <div className="flex items-center gap-2 md:gap-4">
              <StellarWallet />

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-400 hover:text-white"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-800 bg-gray-900">
            <div className="px-4 py-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors',
                      isActive
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Polkadot Wallet Section - Full Width Below Header */}
      <div className="w-full bg-gradient-to-r from-purple-900/40 to-purple-800/40 border-b border-purple-500/50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-purple-300 font-medium">Polkadot Wallet</p>
            <PolkadotWallet />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900/30 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-500 text-sm">
              © 2024 GigVault. Trustless freelancing powered by blockchain.
            </p>
            <div className="flex items-center space-x-4 text-sm">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="text-gray-400">Stellar</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span className="text-gray-400">Polkadot</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
