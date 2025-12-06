import { Link } from 'react-router-dom';
import { Briefcase, User, ArrowRight, Wallet } from 'lucide-react';
import { useWallet } from '../context/WalletContext';

export function Dashboard() {
  const { isConnected, address } = useWallet();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-2">
          {isConnected 
            ? `Welcome back! Connected as ${address.slice(0, 8)}...${address.slice(-4)}`
            : 'Connect your wallet to get started'
          }
        </p>
      </div>

      {!isConnected && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 text-center">
          <Wallet className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Wallet Not Connected</h3>
          <p className="text-gray-400 mb-4">
            Connect your Freighter wallet to create projects or view your freelance work.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Link
          to="/app/client"
          className="bg-gray-900 border border-gray-800 hover:border-blue-500/50 rounded-xl p-6 transition-colors group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-blue-400" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-blue-400 transition-colors" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">I'm a Client</h3>
          <p className="text-gray-400">
            Create projects, set milestones, fund escrow, and release payments when work is complete.
          </p>
        </Link>

        <Link
          to="/app/freelancer"
          className="bg-gray-900 border border-gray-800 hover:border-pink-500/50 rounded-xl p-6 transition-colors group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-pink-400" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-pink-400 transition-colors" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">I'm a Freelancer</h3>
          <p className="text-gray-400">
            View assigned projects, submit completed milestones, and receive instant payments.
          </p>
        </Link>
      </div>

      {/* Quick Stats */}
      {isConnected && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Network Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Network</p>
              <p className="text-white font-medium">Stellar Testnet</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Contract</p>
              <p className="text-white font-medium font-mono text-xs">CCKC...XZII</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Status</p>
              <p className="text-green-400 font-medium">Connected</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Wallet</p>
              <p className="text-white font-medium">Freighter</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
