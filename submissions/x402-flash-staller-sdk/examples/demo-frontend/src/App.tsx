import { useState, useEffect } from "react";
import { WalletConnect } from "./components/WalletConnect";
import { ChannelManager } from "./components/ChannelManager";
import { ApiTester } from "./components/ApiTester";
import { MetricsDashboard } from "./components/MetricsDashboard";
import { useFreighter } from "./hooks/useFreighter";
import { usePayments } from "./hooks/usePayments";
import { Zap, Github, FileText } from "lucide-react";
import { Keypair } from "@stellar/stellar-sdk";

function App() {
  const wallet = useFreighter();
  const [sessionKeypair, setSessionKeypair] = useState<Keypair | null>(null);

  // Generate session keypair when wallet connects
  useEffect(() => {
    if (wallet.connected && wallet.publicKey && !sessionKeypair) {
      console.log("🔑 Generating session keypair for payments...");
      const keypair = Keypair.random();
      setSessionKeypair(keypair);
      console.log("✅ Session keypair ready");
    } else if (!wallet.connected && sessionKeypair) {
      setSessionKeypair(null);
    }
  }, [wallet.connected, wallet.publicKey, sessionKeypair]);

  const handleConnect = async () => {
    try {
      console.log("🔗 Connecting to Freighter wallet...");
      await wallet.connect();
    } catch (error) {
      console.error("❌ Failed to connect wallet:", error);
    }
  };

  const handleDisconnect = () => {
    console.log("👋 Disconnecting wallet...");
    wallet.disconnect();
    setSessionKeypair(null);
  };

  const payments = usePayments(
    wallet.publicKey,
    sessionKeypair?.secret() || null
  );

  return (
    <div className="min-h-screen bg-stellar-dark">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-stellar-purple to-stellar-blue p-2 rounded-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-stellar-purple to-stellar-blue bg-clip-text text-transparent">
                  x402-Flash Demo
                </h1>
                <p className="text-sm text-gray-400">
                  Stellar Micropayments SDK
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/yourusername/x402-flash-sdk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="/docs"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FileText className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Lightning-Fast Micropayments
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Experience instant API payments with Stellar blockchain. Open a
            channel once, make unlimited requests with ~100x faster settlement.
          </p>
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-stellar-blue">~5ms</p>
              <p className="text-sm text-gray-400">Payment Latency</p>
            </div>
            <div className="w-px h-12 bg-gray-700"></div>
            <div className="text-center">
              <p className="text-3xl font-bold text-stellar-purple">100x</p>
              <p className="text-sm text-gray-400">Faster than L1</p>
            </div>
            <div className="w-px h-12 bg-gray-700"></div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-400">$0.0001</p>
              <p className="text-sm text-gray-400">Avg Cost/Request</p>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column - Wallet & Channel */}
          <div className="space-y-6">
            <WalletConnect
              connected={wallet.connected}
              publicKey={wallet.publicKey}
              loading={wallet.loading}
              error={wallet.error}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />
            <ChannelManager
              channel={payments.channel}
              loading={payments.loading}
              error={payments.error}
              onOpen={async (amount: string) => {
                await payments.openChannel(amount);
              }}
              onClose={payments.closeChannel}
              disabled={!wallet.connected}
            />
          </div>

          {/* Right Column - API Tester */}
          <div className="lg:col-span-2">
            <ApiTester
              onRequest={payments.makeRequest}
              disabled={!payments.channel}
            />
          </div>
        </div>

        {/* Metrics */}
        <MetricsDashboard
          totalPaid={payments.metrics.totalPaid}
          requestCount={payments.metrics.requestCount}
          avgLatency={payments.metrics.avgLatency}
        />

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h3 className="font-bold mb-2 text-stellar-blue">
              🚀 Getting Started
            </h3>
            <p className="text-sm text-gray-400">
              1. Install Freighter wallet
              <br />
              2. Connect your wallet
              <br />
              3. Open a payment channel
              <br />
              4. Start making requests!
            </p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h3 className="font-bold mb-2 text-stellar-purple">
              ⚡ How It Works
            </h3>
            <p className="text-sm text-gray-400">
              Flash payments use state channels on Stellar for instant
              settlement. No waiting for blockchain confirmations between
              payments.
            </p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h3 className="font-bold mb-2 text-green-400">💰 Pricing</h3>
            <p className="text-sm text-gray-400">
              Weather: 0.001 XLM
              <br />
              Market: 0.005 XLM
              <br />
              Analytics: 0.01 XLM
              <br />
              AI Query: 0.02 XLM
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>
            Built with{" "}
            <span className="text-stellar-purple">x402-flash SDK</span> on{" "}
            <span className="text-stellar-blue">Stellar</span>
          </p>
          <p className="mt-2">
            Network: <span className="text-yellow-400">Testnet</span> •
            Protocol: <span className="text-green-400">x402 v1</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
