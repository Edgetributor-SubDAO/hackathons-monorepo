import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { submitTransaction } from '../lib/stellar/horizonQueries';

interface TransactionConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  transactionXDR: string;
  transactionNetwork: string;
  onConfirm: (signedXDR: string) => Promise<void>;
}

export const TransactionConfirmation: React.FC<TransactionConfirmationProps> = ({
  isOpen,
  onClose,
  transactionXDR,
  transactionNetwork,
  onConfirm,
}) => {
  const { signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      // Sign the transaction using wallet context
      const signedXDR = await signTransaction(transactionXDR, transactionNetwork);
      
      // Submit to Stellar network
      await submitTransaction(signedXDR);
      
      // Notify parent component
      await onConfirm(signedXDR);
      
      // Close modal on success
      onClose();
      
    } catch (err: any) {
      setError(err.message || 'Failed to sign and submit transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4">Confirm Transaction</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Transaction Details:</h3>
          <div className="bg-gray-50 p-3 rounded text-sm">
            <p><strong>Network:</strong> {transactionNetwork}</p>
            <p className="mt-2"><strong>Transaction XDR:</strong></p>
            <div className="mt-1 p-2 bg-gray-100 rounded text-xs font-mono break-all max-h-20 overflow-y-auto">
              {transactionXDR}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Please review the transaction details above and confirm to proceed.
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 py-2 px-4 rounded-md text-white font-medium ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            }`}
          >
            {loading ? 'Signing...' : 'Confirm & Sign'}
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            <strong>Fee:</strong> This transaction will include a network fee of 0.001 XLM (100,000 stroops).
          </p>
        </div>
      </div>
    </div>
  );
};