import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { 
  createPaymentTransaction, 
  createCreateAccountTransaction,
  createTipTransaction,
  checkAccountExists,
  getAccountBalances 
} from '../lib/stellar/transactions';

interface PaymentFormProps {
  onTransactionCreated?: (xdr: string, network: string) => void;
  defaultRecipient?: string;
  defaultAmount?: string;
  isTipMode?: boolean;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  onTransactionCreated,
  defaultRecipient = '',
  defaultAmount = '',
  isTipMode = false
}) => {
  const { stellarAddress } = useWallet();
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [amount, setAmount] = useState(defaultAmount);
  const [memo, setMemo] = useState('');
  const [asset, setAsset] = useState('native');
  const [needsCreateAccount, setNeedsCreateAccount] = useState(false);
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user balances when wallet connects
  useEffect(() => {
    if (stellarAddress) {
      loadBalances();
    }
  }, [stellarAddress]);

  // Check recipient account when address changes
  useEffect(() => {
    if (recipient && recipient.length === 56) {
      checkRecipientAccount();
    }
  }, [recipient]);

  const loadBalances = async () => {
    if (!stellarAddress) return;
    try {
      const accountBalances = await getAccountBalances(stellarAddress);
      setBalances(accountBalances);
    } catch (err) {
      console.error('Failed to load balances:', err);
    }
  };

  const checkRecipientAccount = async () => {
    try {
      const exists = await checkAccountExists(recipient);
      setNeedsCreateAccount(!exists);
      if (!exists && parseFloat(amount) > 0 && parseFloat(amount) < 1) {
        setError('Account creation requires minimum 1 XLM');
      } else {
        setError(null);
      }
    } catch (err) {
      console.error('Failed to check recipient account:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stellarAddress) {
      setError('Please connect your Stellar wallet first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let result;
      
      if (isTipMode) {
        // Use tip transaction for creators
        result = await createTipTransaction({
          source: stellarAddress,
          creator: recipient,
          amount: amount,
          memo: memo || 'CrossTip donation'
        });
      } else if (needsCreateAccount) {
        // Use create account transaction
        result = await createCreateAccountTransaction({
          source: stellarAddress,
          destination: recipient,
          amount: amount,
          memo: memo
        });
      } else {
        // Use regular payment transaction
        result = await createPaymentTransaction({
          source: stellarAddress,
          destination: recipient,
          asset: asset,
          amount: amount,
          memo: memo
        });
      }

      if (onTransactionCreated) {
        onTransactionCreated(result.transaction, result.network_passphrase);
      }

      // Reset form on success
      setRecipient('');
      setAmount('');
      setMemo('');
      setAsset('native');
      
    } catch (err: any) {
      setError(err.message || 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  const getNativeBalance = () => {
    const nativeBalance = balances.find(b => b.asset_type === 'native');
    return nativeBalance ? parseFloat(nativeBalance.balance) : 0;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">
        {isTipMode ? 'Send Tip' : 'Send Payment'}
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {needsCreateAccount && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          <strong>Account Not Funded:</strong> This account doesn't exist on Stellar. 
          Your payment will create the account (minimum 1 XLM required).
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {isTipMode ? 'Creator Address' : 'Recipient Address'}
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="G..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (XLM)
          </label>
          <input
            type="number"
            step="0.0000001"
            min="0.0000001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          {stellarAddress && (
            <p className="text-sm text-gray-500 mt-1">
              Available: {getNativeBalance().toFixed(7)} XLM
            </p>
          )}
        </div>

        {!needsCreateAccount && !isTipMode && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asset
            </label>
            <select
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="native">XLM (Native)</option>
              {balances
                .filter(b => b.asset_type !== 'native' && parseFloat(b.balance) > 0)
                .map((balance, index) => (
                  <option 
                    key={index} 
                    value={`${balance.asset_code}:${balance.asset_issuer}`}
                  >
                    {balance.asset_code} ({parseFloat(balance.balance).toFixed(2)})
                  </option>
                ))
              }
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Memo (Optional)
          </label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder={isTipMode ? "Thanks for the great content!" : "Payment memo"}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={28}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !stellarAddress}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            loading || !stellarAddress
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
          }`}
        >
          {loading ? 'Creating Transaction...' : 
           needsCreateAccount ? 'Create Account & Send' :
           isTipMode ? 'Send Tip' : 'Send Payment'}
        </button>
      </form>

      {stellarAddress && balances.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Your Balances:</h4>
          <div className="space-y-1">
            {balances.map((balance, index) => (
              <div key={index} className="text-sm text-gray-600">
                {balance.asset_type === 'native' 
                  ? 'XLM' 
                  : balance.asset_code
                }: {parseFloat(balance.balance).toFixed(7)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};