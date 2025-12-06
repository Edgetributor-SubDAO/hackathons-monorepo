import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { PaymentForm } from '../components/PaymentForm';
import CrossChainTipForm from '../components/CrossChainTipForm';
import { TransactionConfirmation } from '../components/TransactionConfirmation';

const TipPage = () => {
  const { creatorId } = useParams<{ creatorId: string }>();
  const { stellarAddress, connectStellar, stellarConnected } = useWallet();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [transactionXDR, setTransactionXDR] = useState('');
  const [transactionNetwork, setTransactionNetwork] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'stellar' | 'crosschain'>('stellar');

  const handleTransactionCreated = (xdr: string, network: string) => {
    setTransactionXDR(xdr);
    setTransactionNetwork(network);
    setShowConfirmation(true);
  };

  const handleTransactionConfirmed = async (signedXDR: string) => {
    // TODO: Submit the signed transaction to Horizon
    console.log('Transaction signed and ready to submit:', signedXDR);
    setMessage('Tip sent successfully! 🎉');
    setTimeout(() => setMessage(''), 5000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center">
          {creatorId ? `Send Tip to ${creatorId}` : 'Send a Tip to Creator'}
        </h2>
        
        {message && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg text-center">
            {message}
          </div>
        )}
        
        {!stellarConnected ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h3 className="text-xl font-semibold mb-4">Connect Your Wallet</h3>
            <p className="mb-6 text-gray-600">
              Connect your Stellar wallet to send tips to your favorite creators
            </p>
            <button
              onClick={connectStellar}
              className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 font-medium"
            >
              Connect Stellar Wallet
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">💡 How it works</h3>
              <p className="text-blue-700 text-sm">
                Send instant tips to creators using Stellar's fast network, or send cross-chain tips 
                via Axelar to reach creators on Ethereum, Polygon, and other blockchains.
              </p>
            </div>

            {/* Tab Selection */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('stellar')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'stellar'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  ⚡ Stellar Tip
                </button>
                <button
                  onClick={() => setActiveTab('crosschain')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'crosschain'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  🌉 Cross-Chain Tip
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'stellar' ? (
              <PaymentForm
                isTipMode={true}
                defaultRecipient={creatorId || ''}
                onTransactionCreated={handleTransactionCreated}
              />
            ) : (
              <CrossChainTipForm
                defaultRecipient={creatorId || ''}
                onTransactionCreated={handleTransactionCreated}
              />
            )}
            
            <div className="text-center text-sm text-gray-500">
              Connected: {stellarAddress?.slice(0, 8)}...{stellarAddress?.slice(-8)}
            </div>
          </div>
        )}

        <TransactionConfirmation
          isOpen={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          transactionXDR={transactionXDR}
          transactionNetwork={transactionNetwork}
          onConfirm={handleTransactionConfirmed}
        />
      </div>
    </div>
  );
};

export default TipPage;