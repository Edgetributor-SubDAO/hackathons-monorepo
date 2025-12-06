// src/components/ReputationSBT.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  getReputation,
  mintSBT,
  updateScore,
  verifyOwnership,
  getTotalSupply,
  ReputationData,
} from "../services/reputation";
import { useWallet } from "../wallet/WalletContext";

const ReputationSBT: React.FC = () => {
  const { stellar, connectStellar, stellarError } = useWallet();

  // State
  const [reputation, setReputation] = useState<ReputationData | null>(null);
  const [hasNFT, setHasNFT] = useState<boolean>(false);
  const [totalSupply, setTotalSupply] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form state for minting
  const [mintScore, setMintScore] = useState<number>(500);
  const [mintProfile, setMintProfile] = useState<string>("Trader");

  // Form state for updating
  const [newScore, setNewScore] = useState<number>(500);

  // Get level based on score
  const getLevel = (score: number): string => {
    if (score >= 900) return "Platinum";
    if (score >= 600) return "Gold";
    if (score >= 300) return "Silver";
    return "Bronze";
  };

  // Get level color classes
  const getLevelClasses = (level: string): string => {
    switch (level) {
      case "Platinum":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "Gold":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Silver":
        return "bg-gray-200 text-gray-800 border-gray-400";
      default:
        return "bg-amber-100 text-amber-800 border-amber-300";
    }
  };

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!stellar.address) return;

    setIsLoading(true);
    setError(null);

    try {
      const [reputationData, ownership, supply] = await Promise.all([
        getReputation(stellar.address),
        verifyOwnership(stellar.address),
        getTotalSupply(stellar.address),
      ]);

      setReputation(reputationData);
      setHasNFT(ownership);
      setTotalSupply(supply);

      if (reputationData) {
        setNewScore(reputationData.score);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [stellar.address]);

  // Auto-fetch when wallet connects
  useEffect(() => {
    if (stellar.connected && stellar.address) {
      fetchData();
    }
  }, [stellar.connected, stellar.address, fetchData]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Handle mint
  const handleMint = async () => {
    if (!stellar.address) {
      setError("Please connect your wallet first");
      return;
    }

    if (hasNFT) {
      setError("You already have a Reputation SBT. Use Update Score instead.");
      return;
    }

    if (mintScore < 0 || mintScore > 1000) {
      setError("Score must be between 0 and 1000");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      setError("Transaction timed out. Please check your wallet and try again.");
    }, 60000); // 60 second timeout

    try {
      console.log("🎨 Minting SBT with:", {
        address: stellar.address,
        score: mintScore,
        profile: mintProfile
      });

      const result = await mintSBT(stellar.address, mintScore, mintProfile);

      clearTimeout(timeoutId);

      if (result.success) {
        setSuccessMsg(
          `🎉 SBT Minted Successfully! TX: ${result.hash?.substring(0, 12)}...`
        );
        setTimeout(() => fetchData(), 3000);
      } else {
        setError("Minting failed. Please try again.");
      }
    } catch (err) {
      clearTimeout(timeoutId);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to mint SBT. Please try again.";
      setError(errorMessage);
      console.error("❌ Mint error:", err);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  // Handle score update
  const handleUpdateScore = async () => {
    if (!stellar.address) {
      setError("Please connect your wallet first");
      return;
    }

    if (!hasNFT) {
      setError("You need to mint an SBT first before updating score.");
      return;
    }

    if (newScore < 0 || newScore > 1000) {
      setError("Score must be between 0 and 1000");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      setError("Transaction timed out. Please check your wallet and try again.");
    }, 60000); // 60 second timeout

    try {
      console.log("📈 Updating score to:", newScore);

      const result = await updateScore(stellar.address, newScore);

      clearTimeout(timeoutId);

      if (result.success) {
        setSuccessMsg(
          `✅ Score Updated to ${newScore}! TX: ${result.hash?.substring(0, 12)}...`
        );
        setTimeout(() => fetchData(), 3000);
      } else {
        setError("Score update failed. Please try again.");
      }
    } catch (err) {
      clearTimeout(timeoutId);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update score. Please try again.";
      setError(errorMessage);
      console.error("❌ Update error:", err);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  // Connect wallet handler
  const handleConnectWallet = async () => {
    try {
      setError(null);
      await connectStellar();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to connect wallet";
      setError(errorMessage);
    }
  };

  // Profile options
  const profileOptions = [
    "Trader",
    "Governor",
    "Staker",
    "Developer",
    "Validator",
    "Liquidity Provider",
    "NFT Collector",
    "DeFi User",
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Reputation SBT Manager
        </h1>
        <p className="mt-2 text-gray-600">
          Mint and manage your on-chain reputation Soulbound Token
        </p>
        {totalSupply !== null && (
          <p className="mt-1 text-sm text-gray-500">
            Total SBTs Minted: <span className="font-semibold">{totalSupply}</span>
          </p>
        )}
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-medium">❌ {error}</p>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 font-medium">{successMsg}</p>
        </div>
      )}

      {/* Not Connected State */}
      {!stellar.connected || !stellar.address ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Connect Your Stellar Wallet
          </h2>
          <p className="text-gray-600 mb-6">
            Connect your wallet to mint or manage your Reputation SBT
          </p>
          <button
            onClick={handleConnectWallet}
            className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? "Connecting..." : "Connect Wallet"}
          </button>
          {stellarError && (
            <p className="mt-4 text-red-600 text-sm">{stellarError}</p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Wallet Info */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Connected Wallet
                </h2>
                <p className="font-mono text-sm text-gray-600 mt-1 break-all">
                  {stellar.address}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${hasNFT
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600"
                    }`}
                >
                  {hasNFT ? "✓ Has SBT" : "No SBT"}
                </span>
              </div>
            </div>
          </div>

          {/* Current Reputation Display */}
          {reputation && (
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Your Reputation SBT
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Token ID</p>
                  <p className="text-2xl font-bold text-gray-900">
                    #{reputation.token_id}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reputation.score}
                    <span className="text-sm text-gray-500">/1000</span>
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Level</p>
                  <span
                    className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold border ${getLevelClasses(
                      getLevel(reputation.score)
                    )}`}
                  >
                    {getLevel(reputation.score)}
                  </span>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Profile</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {reputation.profile}
                  </p>
                </div>
              </div>
              <div className="mt-4 text-center text-sm text-gray-500">
                Minted:{" "}
                {new Date(reputation.minted_at * 1000).toLocaleString()}
              </div>
            </div>
          )}

          {/* Mint Section - Only show if no SBT */}
          {!hasNFT && (
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                🎨 Mint New Reputation SBT
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Type
                  </label>
                  <select
                    value={mintProfile}
                    onChange={(e) => setMintProfile(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                  >
                    {profileOptions.map((profile) => (
                      <option key={profile} value={profile}>
                        {profile}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Initial Score (0-1000)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    value={mintScore}
                    onChange={(e) =>
                      setMintScore(Math.min(1000, Math.max(0, parseInt(e.target.value) || 0)))
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Level: {getLevel(mintScore)}
                  </p>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleMint}
                    className="w-full p-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    {isLoading ? "Minting..." : "Mint SBT"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Update Score Section - Only show if has SBT */}
          {hasNFT && (
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                📈 Update Your Score
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Score (0-1000)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    value={newScore}
                    onChange={(e) =>
                      setNewScore(Math.min(1000, Math.max(0, parseInt(e.target.value) || 0)))
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    New Level: {getLevel(newScore)}{" "}
                    {reputation && newScore !== reputation.score && (
                      <span
                        className={
                          newScore > reputation.score
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        ({newScore > reputation.score ? "↑" : "↓"}{" "}
                        {Math.abs(newScore - reputation.score)} points)
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleUpdateScore}
                    className="w-full p-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading || (reputation && newScore === reputation.score)}
                  >
                    {isLoading ? "Updating..." : "Update Score"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Refresh Button */}
          <div className="text-center">
            <button
              onClick={fetchData}
              className="px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "Refreshing..." : "🔄 Refresh Data"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReputationSBT;