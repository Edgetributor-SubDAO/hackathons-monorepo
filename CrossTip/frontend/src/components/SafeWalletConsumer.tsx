import React, { useEffect, useState } from 'react';
import { useWallet } from '../contexts/WalletContext';

interface SafeWalletConsumerProps {
  children: (walletContext: ReturnType<typeof useWallet> | null) => React.ReactNode;
  fallback?: React.ReactNode;
}

const SafeWalletConsumer: React.FC<SafeWalletConsumerProps> = ({ 
  children, 
  fallback = <div>Loading wallet context...</div> 
}) => {
  const [walletContext, setWalletContext] = useState<ReturnType<typeof useWallet> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const context = useWallet();
      setWalletContext(context);
      setError(null);
    } catch (err) {
      console.error('Failed to get wallet context:', err);
      setError(err instanceof Error ? err.message : 'Failed to get wallet context');
      setWalletContext(null);
    }
  }, []);

  if (error) {
    return (
      <div className="text-red-500 p-4 bg-red-100 border border-red-400 rounded">
        <p>Wallet Context Error: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reload Page
        </button>
      </div>
    );
  }

  if (!walletContext) {
    return <>{fallback}</>;
  }

  return <>{children(walletContext)}</>;
};

export default SafeWalletConsumer;