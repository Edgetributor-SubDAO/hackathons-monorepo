import { useState } from "react";
import { Link } from "react-router-dom";
import { useWallet, truncateAddress } from "../wallet/WalletContext";

// ============================================
// Logo Components
// ============================================

const StellarLogo = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="currentColor">
    <path d="M16 0L20.944 9.056 30.144 11.056 23.488 18.944 24.832 28.288 16 24 7.168 28.288 8.512 18.944 1.856 11.056 11.056 9.056z" />
  </svg>
);

const PolkadotLogo = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="currentColor">
    <circle cx="16" cy="6" r="4" />
    <circle cx="16" cy="26" r="4" />
    <circle cx="6" cy="11" r="4" />
    <circle cx="26" cy="11" r="4" />
    <circle cx="6" cy="21" r="4" />
    <circle cx="26" cy="21" r="4" />
    <circle cx="16" cy="16" r="3" />
  </svg>
);

// ============================================
// Navbar Component
// ============================================

const Navbar = () => {
  const {
    stellar,
    polkadot,
    isConnectingStellar,
    isConnectingPolkadot,
    stellarError,
    polkadotError,
    connectStellar,
    connectPolkadot,
    disconnectStellar,
    disconnectPolkadot,
    areBothConnected,
    isDemoMode,
    enableDemoMode,
    disableDemoMode,
  } = useWallet();

  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const bothConnected = areBothConnected();

  const handleConnectStellar = () => {
    setShowWalletMenu(false); // Close dropdown first
    connectStellar(); // Opens Albedo popup
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 pt-4 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between bg-gradient-to-r from-rose-50/95 via-pink-50/95 to-rose-50/95 backdrop-blur-md border border-rose-200/50 rounded-full px-4 py-2 shadow-lg shadow-rose-200/20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-rose-900 to-pink-900 rounded-full flex items-center justify-center group-hover:from-rose-800 group-hover:to-pink-800 transition-all duration-300">
              <span className="text-rose-50 font-bold text-sm">CR</span>
            </div>
            <span className="font-semibold text-rose-900 tracking-tight hidden sm:block group-hover:text-rose-950 transition-colors">
              ChainRepute
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/"
              className="text-sm text-rose-700 px-3 py-1.5 rounded-full transition-all duration-300 ease-out hover:bg-rose-100/50 hover:text-rose-900"
            >
              Home
            </Link>
            <Link
              to="/dashboard"
              className="text-sm text-rose-700 px-3 py-1.5 rounded-full transition-all duration-300 ease-out hover:bg-rose-100/50 hover:text-rose-900"
            >
              Dashboard
            </Link>
            <Link
              to="/rewards"
              className="text-sm text-rose-700 px-3 py-1.5 rounded-full transition-all duration-300 ease-out hover:bg-rose-100/50 hover:text-rose-900 hidden md:block"
            >
              Rewards
            </Link>
            <Link
              to="/profile"
              className="text-sm text-rose-700 px-3 py-1.5 rounded-full transition-all duration-300 ease-out hover:bg-rose-100/50 hover:text-rose-900 hidden md:block"
            >
              Profile
            </Link>
          </div>

          {/* Wallet Connection Area */}
          <div className="relative">
            {bothConnected ? (
              /* Both Connected - Show Combined Badge */
              <button
                onClick={() => setShowWalletMenu(!showWalletMenu)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full hover:shadow-md transition-all ${isDemoMode
                  ? "bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200"
                  : "bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200"
                  }`}
              >
                <div className="flex -space-x-1">
                  <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                    <StellarLogo className="w-3 h-3 text-white" />
                  </div>
                  <div className="w-5 h-5 bg-pink-600 rounded-full flex items-center justify-center">
                    <PolkadotLogo className="w-3 h-3 text-white" />
                  </div>
                </div>
                <span className={`text-xs font-medium ${isDemoMode ? "text-amber-700" : "text-emerald-700"}`}>
                  {isDemoMode ? "Demo" : "Connected"}
                </span>
                <svg className={`w-3 h-3 ${isDemoMode ? "text-amber-600" : "text-emerald-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            ) : (
              /* Connect Wallets Button */
              <button
                onClick={() => setShowWalletMenu(!showWalletMenu)}
                className="text-sm px-4 py-2 bg-gradient-to-r from-rose-900 to-pink-900 text-rose-50 rounded-full transition-all duration-300 ease-out hover:from-rose-800 hover:to-pink-800 hover:shadow-lg hover:shadow-rose-900/30 hover:-translate-y-0.5"
              >
                Connect Wallets
              </button>
            )}

            {/* Wallet Dropdown Menu */}
            {showWalletMenu && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-rose-100 overflow-hidden z-50">
                <div className="p-4 bg-gradient-to-r from-rose-50 to-pink-50 border-b border-rose-100">
                  <h3 className="font-semibold text-rose-900">Connect Wallets</h3>
                  <p className="text-xs text-rose-600 mt-1">
                    Connect both chains for cross-chain reputation
                  </p>
                </div>

                <div className="p-4 space-y-3">
                  {/* Stellar Wallet (Albedo - FREE) */}
                  <div className="p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                          <StellarLogo className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">Stellar</p>
                          <p className="text-xs text-gray-500">via Albedo (Free)</p>
                        </div>
                      </div>
                      {stellar.connected && (
                        <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                          ✓ Connected
                        </span>
                      )}
                    </div>

                    {stellar.connected ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500">Stellar Testnet</p>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                            {truncateAddress(stellar.address || "", 8, 6)}
                          </code>
                        </div>
                        <button
                          onClick={disconnectStellar}
                          className="text-xs text-red-500 hover:text-red-700 transition-colors"
                        >
                          Disconnect
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleConnectStellar}
                        disabled={isConnectingStellar}
                        className="w-full py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isConnectingStellar ? "Connecting..." : "Connect Albedo"}
                      </button>
                    )}

                    {stellarError && (
                      <p className="mt-2 text-xs text-red-500">{stellarError}</p>
                    )}
                  </div>

                  {/* Polkadot Wallet */}
                  <div className="p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center">
                          <PolkadotLogo className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">Polkadot</p>
                          <p className="text-xs text-gray-500">
                            {polkadot.wallet?.title || "Talisman / SubWallet"}
                          </p>
                        </div>
                      </div>
                      {polkadot.connected && (
                        <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                          ✓ Connected
                        </span>
                      )}
                    </div>

                    {polkadot.connected ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500">{polkadot.name}</p>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                            {truncateAddress(polkadot.address || "", 8, 6)}
                          </code>
                        </div>
                        <button
                          onClick={disconnectPolkadot}
                          className="text-xs text-red-500 hover:text-red-700 transition-colors"
                        >
                          Disconnect
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => connectPolkadot()}
                        disabled={isConnectingPolkadot}
                        className="w-full py-2 text-sm bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isConnectingPolkadot ? "Connecting..." : "Connect Talisman"}
                      </button>
                    )}

                    {polkadotError && (
                      <p className="mt-2 text-xs text-red-500">{polkadotError}</p>
                    )}
                  </div>

                  {/* Demo Mode Button */}
                  <div className="pt-2 border-t border-gray-100">
                    {isDemoMode ? (
                      <button
                        onClick={disableDemoMode}
                        className="w-full py-2 text-sm bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <span>🧪</span>
                        Exit Demo Mode
                      </button>
                    ) : (
                      <button
                        onClick={enableDemoMode}
                        className="w-full py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <span>🧪</span>
                        Try Demo Mode (No Wallet Needed)
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                  <p className="text-xs text-gray-500 text-center">
                    {isDemoMode
                      ? "🧪 Demo mode active - using test addresses"
                      : bothConnected
                        ? "✨ Both wallets connected! Ready to scan."
                        : "Connect both wallets to scan your reputation"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close */}
      {showWalletMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowWalletMenu(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;
