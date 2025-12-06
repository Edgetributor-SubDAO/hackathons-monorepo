import { Wallet, Loader2 } from 'lucide-react';
import { useWallet } from '../context/WalletContext';

export function StellarWallet() {
  const { isConnected, address, isConnecting, error, connect, disconnect } = useWallet();

  return (
    <div className="flex items-center">
      {error && (
        <span className="text-red-400 text-sm hidden md:inline mr-2">{error}</span>
      )}
      {isConnected ? (
        <button
          onClick={disconnect}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-all text-sm"
          title="Stellar (Freighter)"
        >
          <Wallet className="w-4 h-4" />
          <span className="hidden sm:inline">
            {address.slice(0, 4)}...{address.slice(-4)}
          </span>
          <span className="sm:hidden">Stellar</span>
        </button>
      ) : (
        <button
          onClick={connect}
          disabled={isConnecting}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50 text-sm"
          title="Connect Stellar Wallet (Freighter)"
        >
          {isConnecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Wallet className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {isConnecting ? 'Connecting...' : 'Stellar'}
          </span>
          <span className="sm:hidden">
            {isConnecting ? '...' : 'STL'}
          </span>
        </button>
      )}
    </div>
  );
}
