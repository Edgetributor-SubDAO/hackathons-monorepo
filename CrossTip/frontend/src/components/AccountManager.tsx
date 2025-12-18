import React, { useState } from 'react';
import { stellarAccountService, CreateAccountResult, AccountInfo } from '../services/stellarAccount';
import { useWallet } from '../contexts/WalletContext';

const AccountManager: React.FC = () => {
  const { stellarAddress, stellarConnected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreateAccountResult | null>(null);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [error, setError] = useState<string>('');

  const handleCreateTestnetAccount = async () => {
    setLoading(true);
    setError('');
    try {
      const newAccount = await stellarAccountService.createTestnetAccount();
      setResult(newAccount);
      if (newAccount.success) {
        console.log('New account created:');
        console.log('Public Key:', newAccount.account.publicKey);
        console.log('Secret Key:', newAccount.account.secretKey);
        console.log('⚠️ Save the secret key securely - it will not be shown again!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleGetAccountInfo = async () => {
    if (!stellarAddress) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const info = await stellarAccountService.getAccountInfo(stellarAddress);
      setAccountInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get account info');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUSDCTrustline = async () => {
    // This would require the secret key, which we don't have from wallet connection
    // This is more for demonstration purposes
    setError('Creating trustlines requires secret key access. Use the Stellar Laboratory or dedicated wallet apps.');
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    return num.toFixed(7);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Stellar Account Manager</h2>
      
      {/* Account Creation Section */}
      <div className="mb-8 p-4 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Create New Testnet Account</h3>
        <p className="text-sm text-gray-600 mb-4">
          This will create and fund a new account on the Stellar testnet using Friendbot.
        </p>
        <button
          onClick={handleCreateTestnetAccount}
          disabled={loading}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? 'Creating Account...' : 'Create Testnet Account'}
        </button>
      </div>

      {/* Account Creation Result */}
      {result && (
        <div className={`mb-8 p-4 border rounded-lg ${
          result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            result.success ? 'text-green-800' : 'text-red-800'
          }`}>
            {result.success ? '✅ Account Created Successfully!' : '❌ Account Creation Failed'}
          </h3>
          
          {result.success ? (
            <div className="space-y-2">
              <div>
                <strong>Public Key:</strong>
                <code className="block mt-1 p-2 bg-gray-100 rounded text-sm break-all">
                  {result.account.publicKey}
                </code>
              </div>
              <div>
                <strong>Secret Key:</strong>
                <code className="block mt-1 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm break-all">
                  {result.account.secretKey}
                </code>
                <p className="text-xs text-yellow-700 mt-1">
                  ⚠️ Save this secret key securely! It will not be shown again.
                </p>
              </div>
              <div>
                <strong>Initial Balance:</strong> {formatBalance(result.account.balance)} XLM
              </div>
              <div>
                <strong>Transaction Hash:</strong>
                <code className="block mt-1 p-2 bg-gray-100 rounded text-sm break-all">
                  {result.transactionHash}
                </code>
              </div>
            </div>
          ) : (
            <p className="text-red-700">{result.error}</p>
          )}
        </div>
      )}

      {/* Connected Account Info Section */}
      {stellarConnected && (
        <div className="mb-8 p-4 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Connected Account Information</h3>
          <div className="mb-4">
            <strong>Connected Address:</strong>
            <code className="block mt-1 p-2 bg-gray-100 rounded text-sm break-all">
              {stellarAddress}
            </code>
          </div>
          <button
            onClick={handleGetAccountInfo}
            disabled={loading}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {loading ? 'Loading...' : 'Get Account Info'}
          </button>
        </div>
      )}

      {/* Account Info Display */}
      {accountInfo && (
        <div className="mb-8 p-4 border border-blue-200 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-blue-800">Account Details</h3>
          <div className="space-y-3">
            <div>
              <strong>XLM Balance:</strong> {formatBalance(accountInfo.balance)} XLM
            </div>
            {accountInfo.trustlines.length > 0 ? (
              <div>
                <strong>Asset Trustlines:</strong>
                <div className="mt-2 space-y-1">
                  {accountInfo.trustlines.map((trustline, index) => (
                    <div key={index} className="flex justify-between p-2 bg-white rounded border">
                      <span className="font-medium">{trustline.asset}</span>
                      <span>{formatBalance(trustline.balance)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <strong>Asset Trustlines:</strong> None established
                <p className="text-sm text-gray-600 mt-1">
                  Create trustlines to hold other assets like USDC.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trustline Creation Section */}
      <div className="mb-8 p-4 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Create USDC Trustline</h3>
        <p className="text-sm text-gray-600 mb-4">
          Create a trustline to hold USDC tokens. This requires secret key access.
        </p>
        <button
          onClick={handleCreateUSDCTrustline}
          className="px-6 py-2 rounded-lg font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors"
        >
          Create USDC Trustline
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <p className="text-red-700">❌ {error}</p>
        </div>
      )}

      {/* Educational Information */}
      <div className="mt-8 p-4 border border-gray-200 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">About Stellar Accounts</h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p>
            <strong>Account Creation:</strong> Stellar accounts require a minimum balance of 1 XLM to exist on the network.
          </p>
          <p>
            <strong>Testnet vs Mainnet:</strong> Testnet accounts can be funded for free using Friendbot. Mainnet accounts require real XLM.
          </p>
          <p>
            <strong>Trustlines:</strong> To hold assets other than XLM, accounts must establish trustlines to those assets.
          </p>
          <p>
            <strong>Security:</strong> Never share your secret key. Public keys are safe to share and identify your account.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountManager;