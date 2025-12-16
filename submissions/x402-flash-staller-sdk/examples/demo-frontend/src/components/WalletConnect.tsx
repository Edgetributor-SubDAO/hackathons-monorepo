import React from "react";
import { Wallet, LogOut } from "lucide-react";

interface WalletConnectProps {
  connected: boolean;
  publicKey: string | null;
  loading: boolean;
  error: string | null;
  onConnect: () => Promise<void>;
  onDisconnect: () => void;
}

export function WalletConnect({
  connected,
  publicKey,
  loading,
  error,
  onConnect,
  onDisconnect,
}: WalletConnectProps) {
  return (
    <div className="gradient-border">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Freighter Wallet
          </h2>
          {connected && (
            <button
              onClick={onDisconnect}
              className="text-red-400 hover:text-red-300 flex items-center gap-1 text-sm"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin w-8 h-8 border-4 border-stellar-purple border-t-transparent rounded-full mx-auto"></div>
            <p className="text-sm text-gray-400 mt-2">Connecting...</p>
          </div>
        ) : connected && publicKey ? (
          <div className="space-y-2">
            <div className="bg-green-500/10 border border-green-500/20 rounded px-3 py-2">
              <p className="text-sm text-green-400 font-mono">
                {publicKey.slice(0, 8)}...{publicKey.slice(-8)}
              </p>
            </div>
            <p className="text-xs text-gray-400">
              ✅ Connected to Stellar testnet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-400">
              Connect your Freighter wallet to start making micropayments
            </p>
            <button
              onClick={onConnect}
              className="w-full bg-stellar-purple hover:bg-stellar-purple/80 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Connect Freighter
            </button>
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
                {error}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Don't have Freighter?{" "}
              <a
                href="https://www.freighter.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-stellar-blue hover:underline"
              >
                Install it here
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
