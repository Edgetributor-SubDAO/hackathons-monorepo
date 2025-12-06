import { Link, useLocation, Outlet } from 'react-router-dom';
import { Home, Briefcase, User, Wallet, Menu, X, Loader2, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { useWallet } from '../context/WalletContext';
import { PolkadotWallet } from './PolkadotWallet';

export function AppLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Use shared wallet context
  const { isConnected, address, isConnecting, error, connect, disconnect } = useWallet();

  const navItems = [
    { path: '/app', label: 'Dashboard', icon: Home },
    { path: '/app/client', label: 'Client', icon: Briefcase },
    { path: '/app/freelancer', label: 'Freelancer', icon: User },
  ];

  // Polkadot dashboard link (separate route, not breaking Stellar)
  const polkadotLink = { path: '/polkadot', label: 'Polkadot', icon: ExternalLink };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navigation */}
      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">FE</span>
              </div>
              <span className="text-white font-semibold hidden sm:block">FreelanceEscrow</span>
            </Link>

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
                      "flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors",
                      isActive 
                        ? "bg-gray-800 text-white" 
                        : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              {/* Polkadot Dashboard Link - Separate from Stellar */}
              <Link
                to={polkadotLink.path}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 hover:text-purple-300 border border-purple-500/30"
              >
                <polkadotLink.icon className="w-4 h-4" />
                <span>{polkadotLink.label}</span>
              </Link>
            </div>

            {/* Wallet Connections */}
            <div className="flex items-center space-x-3 md:space-x-4">
              {/* Stellar Wallet */}
              {isConnected ? (
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:flex items-center space-x-2 bg-gray-800 px-3 py-1.5 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm text-gray-300 font-mono">
                      {address.slice(0, 4)}...{address.slice(-4)}
                    </span>
                  </div>
                  <button
                    onClick={disconnect}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={connect}
                  disabled={isConnecting}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                >
                  {isConnecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wallet className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">
                    {isConnecting ? 'Connecting...' : 'Stellar'}
                  </span>
                </button>
              )}

              {/* Polkadot Wallet */}
              <PolkadotWallet />

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
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors",
                      isActive 
                        ? "bg-gray-800 text-white" 
                        : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Error display */}
      {error && (
        <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-2">
          <p className="text-red-400 text-sm text-center">{error}</p>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Built on</span>
              <span className="text-blue-400">Stellar</span>
              <span>&</span>
              <span className="text-pink-400">Polkadot</span>
            </div>
            <div className="text-sm text-gray-500">
              Hackathon Project 2024
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
