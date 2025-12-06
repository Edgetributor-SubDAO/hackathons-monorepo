import React from 'react';
import { useEnhancedWallet, WalletType } from '../contexts/EnhancedWalletContext';

const EnhancedWalletSelector: React.FC = () => {
  const {
    availableWallets,
    selectedWallet,
    stellarAddress,
    stellarConnected,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
    clearError
  } = useEnhancedWallet();

  const handleWalletConnect = async (walletType: WalletType) => {
    try {
      await connectWallet(walletType);
    } catch (error) {
      console.error('Connection failed:', error);
      // Error is already handled in context
    }
  };

  const handleDisconnect = async () => {
    await disconnectWallet();
  };

  if (stellarConnected && stellarAddress) {
    return (
      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">
            {selectedWallet?.icon} Connected to {selectedWallet?.name}
          </h3>
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
          >
            Disconnect
          </button>
        </div>
        <div className="p-4 bg-gray-900 rounded-lg">
          <p className="text-sm text-gray-400 mb-2">Stellar Address:</p>
          <p className="text-white font-mono text-sm break-all">
            {stellarAddress}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-bold text-white mb-4">Connect Stellar Wallet</h3>
      
      {error && (
        <div className="mb-4 p-4 bg-red-900 bg-opacity-50 border border-red-500 rounded-lg">
          <div className="flex justify-between items-start">
            <p className="text-red-200 text-sm">{error}</p>
            <button
              onClick={clearError}
              className="text-red-300 hover:text-red-100 ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {availableWallets.map((wallet) => (
          <button
            key={wallet.id}
            onClick={() => handleWalletConnect(wallet.id)}
            disabled={isLoading || !wallet.isInstalled}
            className={`
              p-4 rounded-lg border-2 transition-all
              ${
                wallet.isInstalled
                  ? 'border-gray-600 hover:border-stellar bg-gray-700 hover:bg-gray-600 text-white'
                  : 'border-gray-700 bg-gray-800 text-gray-500 cursor-not-allowed'
              }
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{wallet.icon}</span>
              <div className="text-left">
                <div className="font-semibold">{wallet.name}</div>
                <div className="text-xs text-gray-400">
                  {wallet.isInstalled ? 'Ready to connect' : 'Not installed'}
                </div>
              </div>
            </div>
            {!wallet.isInstalled && (
              <div className="mt-2">
                <a
                  href={wallet.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Install {wallet.name}
                </a>
              </div>
            )}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center space-x-2 text-stellar">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-stellar"></div>
            <span className="text-sm">Connecting to wallet...</span>
          </div>
        </div>
      )}

      <div className="mt-6 text-xs text-gray-400">
        <p className="mb-2"><strong>Supported Wallets:</strong></p>
        <ul className="space-y-1">
          <li>• <strong>Freighter:</strong> Official Stellar Development Foundation wallet</li>
          <li>• <strong>Albedo:</strong> Web-based Stellar wallet</li>
          <li>• <strong>Rabet:</strong> Non-custodial Stellar wallet</li>
          <li>• <strong>LOBSTR:</strong> Popular Stellar wallet with advanced features</li>
        </ul>
      </div>
    </div>
  );
};

export default EnhancedWalletSelector;