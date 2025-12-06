import { Wallet } from 'lucide-react';

export function PolkadotTestPage() {
  const handleConnectPolkadot = () => {
    console.log('Polkadot wallet connection initiated');
    // TODO: Implement typeink wallet connection
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-white">Polkadot Wallet Test</h1>
          <p className="text-gray-400 text-sm mt-1">Standalone page to test Polkadot button visibility</p>
        </div>
      </div>

      {/* Polkadot Wallet Section - Full Width Below Header */}
      <div className="w-full bg-gradient-to-r from-purple-900/40 to-purple-800/40 border-b border-purple-500/50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-purple-300 font-medium">Polkadot Wallet</p>
            <div className="flex items-center justify-center">
              <button
                onClick={handleConnectPolkadot}
                className="flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white transition-all text-base shadow-lg hover:shadow-purple-500/50 border border-purple-400/50"
                title="Connect Polkadot Wallet (SubWallet/Talisman/PolkadotJS)"
              >
                <Wallet className="w-5 h-5" />
                <span>Connect Polkadot Wallet</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
          <h2 className="text-xl font-bold text-white mb-4">Test Information</h2>
          
          <div className="space-y-4 text-gray-300">
            <div>
              <h3 className="font-semibold text-white mb-2">Versions:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>dedot: 0.18.0</li>
                <li>typink: 0.5.0</li>
                <li>React: 19.2.0</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">RPC Endpoint:</h3>
              <p className="text-sm font-mono bg-gray-800 p-2 rounded">
                wss://testnet-passet-hub.polkadot.io
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">Instructions:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Open browser DevTools (F12)</li>
                <li>Check Console tab for any errors</li>
                <li>Click the "Connect Polkadot Wallet" button above</li>
                <li>Check Console for "Polkadot wallet connection initiated" message</li>
                <li>Verify button is visible and clickable</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">Expected Behavior:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Button should be visible in purple gradient section</li>
                <li>Button should be clickable</li>
                <li>Console should log when clicked</li>
                <li>No TypeScript or runtime errors</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
          <h3 className="font-semibold text-blue-300 mb-2">Debug Info</h3>
          <p className="text-sm text-blue-200">
            If the button is not visible, check the browser console for errors. 
            This page is a standalone test to isolate the button rendering issue.
          </p>
        </div>
      </main>
    </div>
  );
}
