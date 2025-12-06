import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { StellarService, NetworkInfo, CrossChainTipParams } from '../services/stellar';
import { config } from '../config';

interface CrossChainTipFormProps {
  onTransactionCreated?: (txHash: string, network: string) => void;
  defaultRecipient?: string;
  defaultAmount?: string;
}

type BridgeType = 'axelar' | 'xcm';

const CrossChainTipForm: React.FC<CrossChainTipFormProps> = ({
  onTransactionCreated,
  defaultRecipient = '',
  defaultAmount = ''
}) => {
  const { stellarAddress, stellarConnected } = useWallet();
  const [stellarService] = useState(() => new StellarService());
  
  // Form state
  const [bridgeType, setBridgeType] = useState<BridgeType>('axelar');
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkInfo | null>(null);
  const [recipientAddress, setRecipientAddress] = useState(defaultRecipient);
  const [creatorAddress, setCreatorAddress] = useState('');
  const [amount, setAmount] = useState(defaultAmount);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Available networks
  const [axelarNetworks, setAxelarNetworks] = useState<NetworkInfo[]>([]);
  const [xcmNetworks, setXcmNetworks] = useState<NetworkInfo[]>([]);

  useEffect(() => {
    // Load supported networks
    const networks = stellarService.getAllSupportedNetworks();
    setAxelarNetworks(networks.axelar);
    setXcmNetworks(networks.xcm);
    
    // Set default network
    if (networks.axelar.length > 0) {
      setSelectedNetwork(networks.axelar[0]);
    }
  }, [stellarService]);

  const getCurrentNetworks = (): NetworkInfo[] => {
    return bridgeType === 'axelar' ? axelarNetworks : xcmNetworks;
  };

  const validateForm = (): string | null => {
    if (!stellarConnected || !stellarAddress) {
      return 'Please connect your wallet first';
    }
    
    if (!selectedNetwork) {
      return 'Please select a destination network';
    }
    
    if (!recipientAddress.trim()) {
      return 'Please enter a recipient address';
    }
    
    if (!creatorAddress.trim()) {
      return 'Please enter a creator address';
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      return 'Please enter a valid tip amount';
    }
    
    // Validate recipient address format
    if (!stellarService.validateAddress(recipientAddress, bridgeType)) {
      const expectedFormat = bridgeType === 'axelar' ? 'Ethereum (0x...)' : 'Polkadot (SS58)';
      return `Invalid address format. Expected ${expectedFormat} address.`;
    }
    
    // Validate creator address (should be Stellar)
    if (!stellarService.isValidStellarAddress(creatorAddress)) {
      return 'Creator address must be a valid Stellar address (G...)';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!selectedNetwork || !stellarAddress) return;

    setIsSubmitting(true);

    try {
      const tipParams: CrossChainTipParams = {
        sender: stellarAddress,
        destinationChain: bridgeType === 'axelar' ? selectedNetwork.id.toString() : `parachain-${selectedNetwork.id}`,
        destinationAddress: recipientAddress,
        creator: creatorAddress,
        amount: (parseFloat(amount) * 10_000_000).toString(), // Convert to stroops
        message: message || `Cross-chain tip via ${selectedNetwork.name}`,
        gasPaymentToken: {
          address: config.axelar.gasServiceAddress,
          amount: (0.1 * 10_000_000).toString() // 0.1 XLM for gas
        }
      };

      const txHash = await stellarService.sendCrossChainTip(tipParams);
      
      setSuccess(`Transaction submitted! Hash: ${stellarService.formatAddress(txHash)}`);
      
      if (onTransactionCreated) {
        onTransactionCreated(txHash, selectedNetwork.name);
      }
      
      // Reset form
      setRecipientAddress('');
      setCreatorAddress('');
      setAmount('');
      setMessage('');
      
    } catch (error) {
      console.error('Transaction failed:', error);
      setError(error instanceof Error ? error.message : 'Transaction failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Send Cross-Chain Tip
        </h2>
        <p className="text-gray-600">
          Send tips across {axelarNetworks.length + xcmNetworks.length}+ blockchain networks using Stellar
        </p>
      </div>

      {/* Bridge Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Choose Bridge Protocol
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              setBridgeType('axelar');
              setSelectedNetwork(axelarNetworks[0] || null);
            }}
            className={`p-4 border rounded-lg text-center transition-colors ${
              bridgeType === 'axelar'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            <div className="font-semibold">Axelar Network</div>
            <div className="text-sm opacity-75">{axelarNetworks.length} EVM Networks</div>
            <div className="text-xs mt-1">Ethereum, Polygon, Avalanche...</div>
          </button>
          
          <button
            type="button"
            onClick={() => {
              setBridgeType('xcm');
              setSelectedNetwork(xcmNetworks[0] || null);
            }}
            className={`p-4 border rounded-lg text-center transition-colors ${
              bridgeType === 'xcm'
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            <div className="font-semibold">XCM Protocol</div>
            <div className="text-sm opacity-75">{xcmNetworks.length} Polkadot Chains</div>
            <div className="text-xs mt-1">Moonbeam, Acala, Astar...</div>
          </button>
        </div>
      </div>

      {/* Network Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Destination Network
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {getCurrentNetworks().map((network) => (
            <button
              key={network.id}
              type="button"
              onClick={() => setSelectedNetwork(network)}
              className={`p-3 border rounded-lg text-center transition-colors ${
                selectedNetwork?.id === network.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              <div className="text-2xl mb-1">{network.icon}</div>
              <div className="font-medium text-sm">{network.name}</div>
              <div className="text-xs opacity-75">{network.symbol}</div>
            </button>
          ))}
        </div>
        
        {selectedNetwork && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
            <div className="flex justify-between">
              <span>Estimated Fee:</span>
              <span className="font-medium">{selectedNetwork.fee}</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Time:</span>
              <span className="font-medium">{selectedNetwork.estimatedTime}</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Recipient Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recipient Address
          </label>
          <input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder={
              bridgeType === 'axelar' 
                ? '0x742d35Cc6634C0532925a3b8D098A959B02b...' 
                : '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-sm text-gray-500">
            {bridgeType === 'axelar' 
              ? 'Enter an Ethereum-compatible address (0x...)' 
              : 'Enter a Polkadot address (SS58 format)'
            }
          </p>
        </div>

        {/* Creator Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Creator Address (who receives the tip)
          </label>
          <input
            type="text"
            value={creatorAddress}
            onChange={(e) => setCreatorAddress(e.target.value)}
            placeholder="GAOESWIJ53JFJY2TINA5DEHUNJMTGEXHOD2DO2IYU7QUUVGYQFYF4NY2"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-sm text-gray-500">
            Stellar address of the creator who will receive the tip
          </p>
        </div>

        {/* Tip Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tip Amount (XLM)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1.0"
            step="0.0000001"
            min="0.0000001"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-sm text-gray-500">
            Amount to tip in XLM (minimum: 0.0000001)
          </p>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message (Optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Great content! Here's a tip from Stellar!"
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!stellarConnected || isSubmitting}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            !stellarConnected || isSubmitting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Sending Cross-Chain Tip...
            </div>
          ) : !stellarConnected ? (
            'Connect Wallet to Send Tip'
          ) : (
            `Send Tip via ${selectedNetwork?.name || 'Selected Network'}`
          )}
        </button>

        {/* Transaction Info */}
        {selectedNetwork && stellarConnected && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Transaction Summary</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <div className="flex justify-between">
                <span>Destination:</span>
                <span className="font-medium">{selectedNetwork.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Bridge:</span>
                <span className="font-medium">{bridgeType === 'axelar' ? 'Axelar Network' : 'XCM Protocol'}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Fee:</span>
                <span className="font-medium">{selectedNetwork.fee}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Time:</span>
                <span className="font-medium">{selectedNetwork.estimatedTime}</span>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default CrossChainTipForm;