import { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { config } from '../config';

const CreatorDashboard = () => {
  const { stellarAddress, stellarConnected } = useWallet();
  const [balance, setBalance] = useState('0');
  const [totalTips, setTotalTips] = useState(0);
  const [recentTips, setRecentTips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (stellarConnected && stellarAddress) {
      fetchDashboardData();
    }
  }, [stellarConnected, stellarAddress]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch balance and tips from relayer API
      const response = await fetch(
        `${config.relayer.apiUrl}/stats`
      );
      const data = await response.json();
      
      setTotalTips(data.total_tips || 0);
      setBalance(data.total_amount || '0');
      
      // Mock recent tips for demo
      setRecentTips([
        { from: 'GABC...XYZ', amount: '0.5', timestamp: new Date().toISOString() },
        { from: 'GDEF...ABC', amount: '1.2', timestamp: new Date().toISOString() },
      ]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!stellarConnected) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-400 mb-8">
            Please connect your Stellar wallet to view your creator dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-white mb-8">Creator Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md rounded-xl p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-2">Total Balance</div>
          <div className="text-3xl font-bold text-white">{balance} XLM</div>
          <div className="text-stellar text-sm mt-2">≈ ${(parseFloat(balance) * 0.12).toFixed(2)} USD</div>
        </div>

        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md rounded-xl p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-2">Total Tips Received</div>
          <div className="text-3xl font-bold text-white">{totalTips}</div>
          <div className="text-green-400 text-sm mt-2">All time</div>
        </div>

        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md rounded-xl p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-2">Pending Settlement</div>
          <div className="text-3xl font-bold text-white">0</div>
          <div className="text-polkadot text-sm mt-2">On Polkadot</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md rounded-xl p-6 border border-gray-700 mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="flex space-x-4">
          <button className="px-6 py-3 bg-stellar hover:bg-stellar-dark text-white rounded-lg font-medium transition-colors">
            Withdraw to Stellar
          </button>
          <button className="px-6 py-3 bg-polkadot hover:bg-polkadot-dark text-white rounded-lg font-medium transition-colors">
            View on Polkadot
          </button>
          <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors">
            Share Tip Link
          </button>
        </div>
      </div>

      {/* Recent Tips */}
      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Recent Tips</h2>
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : recentTips.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No tips received yet. Share your tip link to get started!
          </div>
        ) : (
          <div className="space-y-4">
            {recentTips.map((tip, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-700 bg-opacity-50 rounded-lg"
              >
                <div>
                  <div className="text-white font-medium">{tip.amount} XLM</div>
                  <div className="text-gray-400 text-sm">From: {tip.from}</div>
                </div>
                <div className="text-gray-400 text-sm">
                  {new Date(tip.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorDashboard;
