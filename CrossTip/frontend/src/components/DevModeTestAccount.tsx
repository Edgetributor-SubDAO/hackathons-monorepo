import React, { useState } from 'react';
import { config } from '../config';
import { testAccountService } from '../services/testAccount';

interface DevModeProps {
  onTestConnection?: (publicKey: string) => void;
}

const DevModeTestAccount: React.FC<DevModeProps> = ({ onTestConnection }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Only show in development mode
  if (!config.development.testMode) {
    return null;
  }

  const testKeypair = config.development.testKeypair;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleTestConnection = () => {
    if (onTestConnection) {
      onTestConnection(testKeypair.publicKey);
    }
  };

  const checkAccountInfo = async () => {
    setLoading(true);
    try {
      const info = await testAccountService.getAccountInfo();
      setAccountInfo(info);
    } catch (error) {
      console.error('Error checking account:', error);
      setAccountInfo({ error: 'Failed to load account info' });
    } finally {
      setLoading(false);
    }
  };

  const fundAccount = async () => {
    setLoading(true);
    try {
      const success = await testAccountService.fundTestAccount();
      if (success) {
        // Refresh account info after funding
        setTimeout(checkAccountInfo, 2000);
      }
    } catch (error) {
      console.error('Error funding account:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatKey = (key: string) => {
    return `${key.substring(0, 8)}...${key.substring(key.length - 8)}`;
  };

  return (
    <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-yellow-400">🧪</span>
          <span className="text-yellow-300 font-medium">Development Test Account</span>
        </div>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="text-yellow-400 hover:text-yellow-300 text-sm"
        >
          {isVisible ? 'Hide' : 'Show'}
        </button>
      </div>

      {isVisible && (
        <div className="mt-3 space-y-3">
          <div className="text-sm text-yellow-200">
            <p>Use this test keypair for development and testing:</p>
          </div>

          <div className="bg-gray-800 rounded p-3 space-y-2">
            <div>
              <div className="text-xs text-gray-400 mb-1">Public Key:</div>
              <div className="flex items-center space-x-2">
                <code className="text-green-400 text-sm font-mono">
                  {formatKey(testKeypair.publicKey)}
                </code>
                <button
                  onClick={() => copyToClipboard(testKeypair.publicKey)}
                  className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
                >
                  {copied ? '✓' : 'Copy'}
                </button>
              </div>
            </div>

            {testKeypair.secretKey && (
              <div>
                <div className="text-xs text-gray-400 mb-1">Secret Key:</div>
                <div className="flex items-center space-x-2">
                  <code className="text-red-400 text-sm font-mono">
                    {formatKey(testKeypair.secretKey)}
                  </code>
                  <button
                    onClick={() => copyToClipboard(testKeypair.secretKey!)}
                    className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleTestConnection}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
            >
              Test Connection
            </button>
            <button
              onClick={checkAccountInfo}
              disabled={loading}
              className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 px-3 py-1 rounded text-sm"
            >
              {loading ? 'Loading...' : 'Check Account'}
            </button>
            <button
              onClick={fundAccount}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-3 py-1 rounded text-sm"
            >
              {loading ? 'Funding...' : 'Fund Account'}
            </button>
            <button
              onClick={() => window.open(testAccountService.getExplorerUrl(), '_blank')}
              className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm"
            >
              View on Explorer
            </button>
          </div>

          {accountInfo && (
            <div className="mt-3 bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400 mb-1">Account Status:</div>
              {accountInfo.error ? (
                <div className="text-red-400 text-sm">
                  {accountInfo.error}
                  {accountInfo.fundUrl && (
                    <div className="mt-1">
                      <button
                        onClick={fundAccount}
                        className="text-green-400 hover:text-green-300 underline"
                      >
                        Click to fund account
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-green-400 text-sm">✅ Account exists and funded</div>
                  {accountInfo.balances && accountInfo.balances.length > 0 && (
                    <div className="text-sm">
                      <strong>Balances:</strong>
                      {accountInfo.balances.map((balance: any, idx: number) => (
                        <div key={idx} className="ml-2">
                          {balance.balance} {balance.asset_type === 'native' ? 'XLM' : balance.asset_code}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="text-xs text-yellow-300 bg-yellow-900 bg-opacity-30 p-2 rounded">
            <strong>⚠️ Security Notice:</strong> This is a test keypair for development only. 
            Never use this on mainnet or with real funds!
          </div>
        </div>
      )}
    </div>
  );
};

export default DevModeTestAccount;