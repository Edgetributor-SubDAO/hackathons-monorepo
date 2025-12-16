import React, { useState } from "react";
import { Wallet, X, AlertCircle } from "lucide-react";
import { Channel } from "../hooks/usePayments";

interface ChannelManagerProps {
  channel: Channel | null;
  loading: boolean;
  error: string | null;
  onOpen: (amount: string) => Promise<void>;
  onClose: () => Promise<void>;
  disabled?: boolean;
}

export function ChannelManager({
  channel,
  loading,
  error,
  onOpen,
  onClose,
  disabled = false,
}: ChannelManagerProps) {
  const [amount, setAmount] = useState("1000000"); // 0.1 XLM default
  const [isOpening, setIsOpening] = useState(false);

  const handleOpen = async () => {
    if (disabled) return;

    setIsOpening(true);
    try {
      await onOpen(amount);
    } catch (err: any) {
      // Error already handled in usePayments
      console.error("Channel open error:", err);
    } finally {
      setIsOpening(false);
    }
  };

  const handleClose = async () => {
    if (disabled || !channel) return;

    if (
      !window.confirm("Close payment channel and withdraw remaining balance?")
    ) {
      return;
    }

    try {
      await onClose();
    } catch (err) {
      console.error("Channel close error:", err);
    }
  };

  return (
    <div className="gradient-border">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Payment Channel
          </h2>
          {channel && (
            <button
              onClick={handleClose}
              className="text-red-400 hover:text-red-300 flex items-center gap-1 text-sm"
              disabled={loading}
            >
              <X className="w-4 h-4" />
              Close
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-400">
              <p className="font-semibold">Error</p>
              <p className="mt-1">{error}</p>
              {error.includes("Account not found") && (
                <p className="mt-2 text-xs">
                  💡 Trying to fund account automatically... Please wait.
                </p>
              )}
              {error.includes("fund") && (
                <p className="mt-2 text-xs">
                  💡 You can also fund manually at{" "}
                  <a
                    href="https://laboratory.stellar.org/#account-creator?network=test"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Stellar Laboratory
                  </a>
                </p>
              )}
            </div>
          </div>
        )}

        {loading || isOpening ? (
          <div className="text-center py-4">
            <div className="animate-spin w-8 h-8 border-4 border-stellar-purple border-t-transparent rounded-full mx-auto"></div>
            <p className="text-sm text-gray-400 mt-2">
              {isOpening ? "Opening channel..." : "Processing..."}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {isOpening
                ? "Funding account and opening channel (5-15 seconds)..."
                : "This may take a moment..."}
            </p>
          </div>
        ) : channel ? (
          <div className="space-y-3">
            <div className="bg-green-500/10 border border-green-500/20 rounded px-3 py-2">
              <p className="text-sm text-green-400 font-semibold">
                ✅ Channel Active
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Balance: {(parseInt(channel.balance) / 10000000).toFixed(4)} XLM
              </p>
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <p>Channel ID: {channel.id.slice(0, 16)}...</p>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${channel.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-stellar-blue hover:underline block"
              >
                View on Stellar Expert →
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-400">
              Open a payment channel to start making micropayments
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Escrow Amount (stroops)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={disabled}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-stellar-purple disabled:opacity-50"
                placeholder="1000000"
                min="100000"
                step="100000"
              />
              <p className="text-xs text-gray-500 mt-1">
                {(parseInt(amount || "0") / 10000000).toFixed(4)} XLM
              </p>
            </div>
            <button
              onClick={handleOpen}
              disabled={disabled || !amount || parseInt(amount) < 100000}
              className="w-full bg-stellar-purple hover:bg-stellar-purple/80 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Open Channel
            </button>
            {disabled && (
              <p className="text-xs text-yellow-400 text-center">
                ⚠️ Connect wallet first
              </p>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
