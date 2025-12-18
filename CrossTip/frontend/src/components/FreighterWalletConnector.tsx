import React, { useState, useEffect } from 'react';
import { stellarWalletService } from '../services/stellarWallet';

interface FreighterWalletConnectorProps {
  onConnection?: (publicKey: string) => void;
  onError?: (error: string) => void;
}

const FreighterWalletConnector: React.FC<FreighterWalletConnectorProps> = ({
  onConnection,
  onError
}) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState('');
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    try {
      const available = await stellarWalletService.isFreighterAvailable();
      setIsAvailable(available);
      
      // Get debug info
      const debug = stellarWalletService.getDebugInfo();
      setDebugInfo(debug);
      
      if (!available) {
        setError('Freighter wallet not detected. Please install the Freighter browser extension.');
      } else {
        setError('');
      }
    } catch (err) {
      console.error('Error checking Freighter availability:', err);
      setError('Failed to check wallet availability');
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');

    try {
      const result = await stellarWalletService.connectFreighter();
      
      if (result.success) {
        setIsConnected(true);
        setPublicKey(result.publicKey);
        if (onConnection) {
          onConnection(result.publicKey);
        }
      } else {
        setError(result.error || 'Failed to connect to Freighter');
        if (onError) {
          onError(result.error || 'Connection failed');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setPublicKey('');
    setError('');
  };

  const formatPublicKey = (key: string) => {
    if (!key) return '';
    return `${key.substring(0, 8)}...${key.substring(key.length - 8)}`;
  };

  return (
    <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center">
          <span className="mr-2">🚀</span>
          Freighter Wallet
        </h3>
        <div className="flex items-center space-x-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-gray-300">
            {isAvailable ? 'Available' : 'Not Available'}
          </span>
        </div>
      </div>

      {!isConnected ? (
        <div className="space-y-4">
          {!isAvailable && (
            <div className="bg-yellow-900 bg-opacity-50 border border-yellow-600 rounded-lg p-4">
              <p className="text-yellow-200 text-sm">
                <strong>⚠️ Freighter Not Detected</strong><br />
                Please install the Freighter browser extension to connect your Stellar wallet.
              </p>
              <div className="mt-3">
                <a
                  href="https://freighter.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm transition-colors"
                >
                  Download Freighter
                </a>
                <button
                  onClick={checkAvailability}
                  className="ml-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm transition-colors"
                >
                  Check Again
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900 bg-opacity-50 border border-red-600 rounded-lg p-4">
              <p className="text-red-200 text-sm">
                <strong>❌ Error:</strong><br />
                {error}
              </p>
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={!isAvailable || isConnecting}
            className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
              isAvailable && !isConnecting
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isConnecting ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Connecting...
              </span>
            ) : (
              'Connect Freighter Wallet'
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-900 bg-opacity-50 border border-green-600 rounded-lg p-4">
            <p className="text-green-200 text-sm mb-2">
              <strong>✅ Connected Successfully</strong>
            </p>
            <div className="bg-gray-800 rounded p-2">
              <div className="text-xs text-gray-400 mb-1">Public Key:</div>
              <div className="font-mono text-green-400 text-sm break-all">
                {formatPublicKey(publicKey)}
              </div>
            </div>
          </div>

          <button
            onClick={handleDisconnect}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Disconnect Wallet
          </button>
        </div>
      )}

      {/* Debug Information (Development Mode Only) */}
      {process.env.NODE_ENV === 'development' && debugInfo && (
        <details className="mt-4">
          <summary className="text-gray-400 text-xs cursor-pointer hover:text-gray-300">
            🔧 Debug Information
          </summary>
          <div className="mt-2 bg-gray-900 rounded p-2 text-xs font-mono text-gray-300">
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        </details>
      )}
    </div>
  );
};

export default FreighterWalletConnector;