import React from 'react';
import { useWallet } from '../contexts/WalletContext';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  // Safety check - if useWallet throws, this component is being rendered outside WalletProvider
  let walletContext;
  try {
    walletContext = useWallet();
  } catch (error) {
    console.error('WalletModal rendered outside WalletProvider:', error);
    return null; // Don't render if not properly wrapped
  }

  const { 
    stellarConnected, 
    polkadotConnected, 
    connectStellar, 
    connectPolkadot,
    disconnectStellar,
    disconnectPolkadot 
  } = walletContext;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-90vw">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Connect Wallet</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Stellar Wallet */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Stellar (Freighter)</h3>
            {stellarConnected ? (
              <button
                onClick={disconnectStellar}
                className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
              >
                Disconnect Stellar
              </button>
            ) : (
              <button
                onClick={connectStellar}
                className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
              >
                Connect Freighter
              </button>
            )}
          </div>

          {/* Polkadot Wallet */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Polkadot (Polkadot.js)</h3>
            {polkadotConnected ? (
              <button
                onClick={disconnectPolkadot}
                className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
              >
                Disconnect Polkadot
              </button>
            ) : (
              <button
                onClick={connectPolkadot}
                className="w-full bg-purple-500 text-white py-2 rounded hover:bg-purple-600"
              >
                Connect Polkadot.js
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletModal;
