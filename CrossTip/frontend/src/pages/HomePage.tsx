import { useWallet } from '../contexts/WalletContext';
import { Link } from 'react-router-dom';
import CreatorIdGenerator from '../components/CreatorIdGenerator';

const HomePage = () => {
  const { stellarConnected, connectStellar } = useWallet();

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-6xl font-bold text-white mb-6">
          Instant Micro-Tips
          <span className="block mt-2 bg-gradient-to-r from-stellar to-polkadot bg-clip-text text-transparent">
            Across Blockchains
          </span>
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
          Receive instant tips on Stellar with settlement and governance on Polkadot.
          Fast, cheap, and secure cross-chain payments for creators.
        </p>
        <div className="flex justify-center space-x-4">
          {stellarConnected ? (
            <Link
              to="/dashboard"
              className="px-8 py-4 bg-gradient-to-r from-stellar to-polkadot text-white rounded-lg font-bold text-lg hover:shadow-lg transition-all"
            >
              Go to Dashboard
            </Link>
          ) : (
            <button
              onClick={connectStellar}
              className="px-8 py-4 bg-gradient-to-r from-stellar to-polkadot text-white rounded-lg font-bold text-lg hover:shadow-lg transition-all"
            >
              Get Started
            </button>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md rounded-xl p-6 border border-gray-700 card-hover">
          <div className="text-4xl mb-4">⚡</div>
          <h3 className="text-xl font-bold text-white mb-2">Instant Tips</h3>
          <p className="text-gray-400">
            Receive micro-tips in seconds on Stellar. Near-zero fees and lightning-fast confirmations.
          </p>
        </div>

        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md rounded-xl p-6 border border-gray-700 card-hover">
          <div className="text-4xl mb-4">🔗</div>
          <h3 className="text-xl font-bold text-white mb-2">Cross-Chain</h3>
          <p className="text-gray-400">
            Settlements bridge to Polkadot for governance, reputation, and composability.
          </p>
        </div>

        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md rounded-xl p-6 border border-gray-700 card-hover">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-xl font-bold text-white mb-2">Secure</h3>
          <p className="text-gray-400">
            Cryptographic proofs and Merkle trees ensure trustless cross-chain settlements.
          </p>
        </div>
      </div>

      {/* Enhanced Creator ID Generator */}
      <CreatorIdGenerator 
        onLinkGenerated={(creatorId, url) => {
          console.log('Creator link generated:', creatorId, url);
        }}
      />

      {/* How It Works */}
      <div className="mt-16 text-center">
        <h2 className="text-3xl font-bold text-white mb-8">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-stellar rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              1
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Connect Wallet</h3>
            <p className="text-gray-400 text-sm">Connect your Stellar wallet to start receiving tips</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-stellar rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              2
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Share Link</h3>
            <p className="text-gray-400 text-sm">Share your tip link or QR code with fans</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-polkadot rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              3
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Receive Tips</h3>
            <p className="text-gray-400 text-sm">Get instant micro-tips on Stellar blockchain</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-polkadot rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              4
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Settle & Withdraw</h3>
            <p className="text-gray-400 text-sm">Settlements bridge to Polkadot for governance</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
