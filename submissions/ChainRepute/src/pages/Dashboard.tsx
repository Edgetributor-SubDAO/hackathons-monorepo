import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ReputationScanner from "../components/ReputationScanner";
import ReputationDashboard from "../components/ReputationDashboard";
import { mintSBT, getReputation, verifyOwnership, type SBTReputation } from "../services/reputation";
import {
    initializePolkadot,
    mintPolkadotSBT,
    getPolkadotReputation,
    type PolkadotReputation
} from "../services/polkadot";
import { useWallet } from "../wallet/WalletContext";
import type { ApiPromise } from "@polkadot/api";
import type { ReputationData } from "../services/api";

// ============================================
// Dashboard Page with Cross-Chain SBT Integration
// ============================================

const Dashboard = () => {
    const { stellar, polkadot, connectStellar, connectPolkadot } = useWallet();
    const [reputationData, setReputationData] = useState<ReputationData | null>(null);
    const [scanError, setScanError] = useState<string | null>(null);
    const [hasSBT, setHasSBT] = useState<boolean>(false);
    const [sbtData, setSbtData] = useState<SBTReputation | null>(null);
    const [isMinting, setIsMinting] = useState<boolean>(false);
    const [mintSuccess, setMintSuccess] = useState<string | null>(null);
    const [mintError, setMintError] = useState<string | null>(null);

    // Polkadot states
    const [polkadotApi, setPolkadotApi] = useState<ApiPromise | null>(null);
    const [hasPolkadotSBT, setHasPolkadotSBT] = useState<boolean>(false);
    const [polkadotSBTData, setPolkadotSBTData] = useState<PolkadotReputation | null>(null);
    const [isPolkadotMinting, setIsPolkadotMinting] = useState<boolean>(false);
    const [polkadotMintError, setPolkadotMintError] = useState<string | null>(null);
    const [polkadotMintSuccess, setPolkadotMintSuccess] = useState<string | null>(null);

    // Initialize Polkadot API on mount
    useEffect(() => {
        const initPdk = async () => {
            try {
                const api = await initializePolkadot();
                setPolkadotApi(api);
                // TODO: Set contract address after deployment
                // setContractAddress("CONTRACT_ADDRESS_HERE");
            } catch (err) {
                console.error("Failed to initialize Polkadot:", err);
            }
        };
        initPdk();
    }, []);

    const handleScanComplete = async (data: ReputationData) => {
        setReputationData(data);
        setScanError(null);

        // Check if user has an SBT for this address
        if (stellar.address) {
            try {
                const ownership = await verifyOwnership(stellar.address);
                setHasSBT(ownership);

                if (ownership) {
                    const sbtInfo = await getReputation(stellar.address);
                    setSbtData(sbtInfo);
                }
            } catch (err) {
                console.error("Error checking SBT:", err);
            }
        }
    };

    const handleScanError = (error: string) => {
        setScanError(error);
    };

    const handleRescan = () => {
        setReputationData(null);
        setScanError(null);
        setMintSuccess(null);
        setMintError(null);
    };

    const handleMintSBT = async () => {
        if (!stellar.connected || !stellar.address) {
            setMintError("Please connect your Stellar wallet first");
            return;
        }

        if (!reputationData) {
            setMintError("Please scan your reputation first");
            return;
        }

        setIsMinting(true);
        setMintError(null);
        setMintSuccess(null);

        const timeoutId = setTimeout(() => {
            setIsMinting(false);
            setMintError("Transaction timed out. Please try again.");
        }, 60000);

        try {
            const result = await mintSBT(
                stellar.address,
                Math.round(reputationData.overallScore),
                reputationData.profile
            );

            clearTimeout(timeoutId);

            if (result.success) {
                setMintSuccess(`🎉 SBT Minted! TX: ${result.hash?.substring(0, 12)}...`);
                setHasSBT(true);

                // Refresh SBT data
                setTimeout(async () => {
                    const sbtInfo = await getReputation(stellar.address!);
                    setSbtData(sbtInfo);
                }, 3000);
            }
        } catch (err) {
            clearTimeout(timeoutId);
            const errorMessage = err instanceof Error ? err.message : "Failed to mint SBT";
            setMintError(errorMessage);
        } finally {
            clearTimeout(timeoutId);
            setIsMinting(false);
        }
    };

    const handleMintPolkadotSBT = async () => {
        if (!polkadot.connected || !polkadot.address) {
            setPolkadotMintError("Please connect your Polkadot wallet first");
            return;
        }

        if (!polkadotApi) {
            setPolkadotMintError("Polkadot API not initialized. Please refresh the page.");
            return;
        }

        if (!reputationData) {
            setPolkadotMintError("Please scan your reputation first");
            return;
        }

        setIsPolkadotMinting(true);
        setPolkadotMintError(null);
        setPolkadotMintSuccess(null);

        const timeoutId = setTimeout(() => {
            setIsPolkadotMinting(false);
            setPolkadotMintError("Transaction timed out. Please try again.");
        }, 120000); // 2 minute timeout for Polkadot

        try {
            console.log("🔨 Minting Polkadot SBT...");

            const result = await mintPolkadotSBT(
                polkadotApi,
                polkadot.address,
                Math.round(reputationData.overallScore),
                reputationData.profile,
                stellar.address || "NOT_LINKED"
            );

            clearTimeout(timeoutId);

            if (result.success) {
                setPolkadotMintSuccess("🎉 Polkadot SBT Minting initiated!");
                setHasPolkadotSBT(true);

                // Refresh Polkadot SBT data
                setTimeout(async () => {
                    const pdk = await initializePolkadot();
                    const sbtInfo = await getPolkadotReputation(pdk, polkadot.address!);
                    setPolkadotSBTData(sbtInfo);
                }, 5000);
            } else {
                setPolkadotMintError(result.error || "Failed to mint Polkadot SBT");
            }
        } catch (err) {
            clearTimeout(timeoutId);
            const errorMessage = err instanceof Error ? err.message : "Failed to mint Polkadot SBT";
            setPolkadotMintError(errorMessage);
        } finally {
            clearTimeout(timeoutId);
            setIsPolkadotMinting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
            <Navbar />

            {/* Main Content */}
            <main className="pt-24 pb-16 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Page Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                            Reputation Dashboard
                        </h1>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Discover your unified cross-chain reputation score across Stellar and Polkadot ecosystems
                        </p>
                    </div>

                    {/* Wallet Connection Banner */}
                    {!stellar.connected && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
                            <p className="text-blue-900 font-medium mb-2">
                                Connect your wallet to mint your Reputation SBT
                            </p>
                            <button
                                onClick={connectStellar}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Connect Stellar Wallet
                            </button>
                        </div>
                    )}

                    {/* Show Scanner or Dashboard based on state */}
                    {!reputationData ? (
                        <ReputationScanner
                            onScanComplete={handleScanComplete}
                            onScanError={handleScanError}
                        />
                    ) : (
                        <>
                            <ReputationDashboard
                                data={reputationData}
                                onRescan={handleRescan}
                            />

                            {/* SBT Minting Section */}
                            <div className="mt-8 bg-white rounded-2xl shadow-xl p-8 border-2 border-rose-100">
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                        🎖️ Mint Your Reputation SBT
                                    </h2>
                                    <p className="text-gray-600">
                                        {hasSBT
                                            ? "You already have a Reputation SBT for this wallet"
                                            : "Lock in your reputation with a Soulbound Token"}
                                    </p>
                                </div>

                                {hasSBT && sbtData ? (
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                                        <div className="flex items-center justify-center gap-3 mb-4">
                                            <span className="text-4xl">✅</span>
                                            <span className="text-xl font-bold text-green-900">SBT Active</span>
                                        </div>
                                        <div className="space-y-2 text-sm text-gray-700">
                                            <div className="flex justify-between">
                                                <span className="font-medium">Token ID:</span>
                                                <span className="font-mono">{sbtData.token_id}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium">Score:</span>
                                                <span className="font-bold text-green-700">{sbtData.score}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium">Profile:</span>
                                                <span className="font-semibold">{sbtData.profile}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {mintSuccess && (
                                            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-center">
                                                {mintSuccess}
                                            </div>
                                        )}

                                        {mintError && (
                                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-center">
                                                {mintError}
                                            </div>
                                        )}

                                        <button
                                            onClick={handleMintSBT}
                                            disabled={isMinting || !stellar.connected}
                                            className={`w-full px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${isMinting
                                                ? "bg-gray-400 cursor-not-allowed"
                                                : !stellar.connected
                                                    ? "bg-gray-300 cursor-not-allowed"
                                                    : "bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white hover:shadow-xl"
                                                }`}
                                        >
                                            {isMinting ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    Minting...
                                                </span>
                                            ) : !stellar.connected ? (
                                                "Connect Wallet First"
                                            ) : (
                                                "🎖️ Mint My SBT"
                                            )}
                                        </button>

                                        <p className="text-xs text-gray-500 text-center">
                                            This will create a non-transferable token on Stellar representing your reputation
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Polkadot SBT Minting Section */}
                            <div className="mt-8 bg-white rounded-2xl shadow-xl p-8 border-2 border-pink-600">
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                        🔗 Cross-Chain Polkadot SBT
                                    </h2>
                                    <p className="text-gray-600">
                                        {hasPolkadotSBT
                                            ? "You already have a Reputation SBT on Polkadot"
                                            : "Mint your reputation on Rococo testnet (Polkadot)"}
                                    </p>
                                </div>

                                {hasPolkadotSBT && polkadotSBTData ? (
                                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                                        <div className="flex items-center justify-center gap-3 mb-4">
                                            <span className="text-4xl">✅</span>
                                            <span className="text-xl font-bold text-purple-900">Polkadot SBT Active</span>
                                        </div>
                                        <div className="space-y-2 text-sm text-gray-700">
                                            <div className="flex justify-between">
                                                <span className="font-medium">Token ID:</span>
                                                <span className="font-mono">{polkadotSBTData.token_id}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium">Score:</span>
                                                <span className="font-bold text-purple-700">{polkadotSBTData.score}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium">Profile:</span>
                                                <span className="font-semibold">{polkadotSBTData.profile}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium">Network:</span>
                                                <span className="font-mono text-xs bg-purple-100 px-2 py-1 rounded">Rococo</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {polkadotMintSuccess && (
                                            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-center">
                                                {polkadotMintSuccess}
                                            </div>
                                        )}

                                        {polkadotMintError && (
                                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-center">
                                                {polkadotMintError}
                                            </div>
                                        )}

                                        {!polkadot.connected ? (
                                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                                                <p className="text-amber-900 font-medium mb-3">
                                                    Connect your Polkadot wallet first
                                                </p>
                                                <button
                                                    onClick={() => connectPolkadot()}
                                                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                                >
                                                    Connect Polkadot Wallet
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handleMintPolkadotSBT}
                                                disabled={isPolkadotMinting || !polkadot.connected || !stellar.address}
                                                className={`w-full px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${isPolkadotMinting
                                                    ? "bg-gray-400 cursor-not-allowed"
                                                    : !polkadot.connected
                                                        ? "bg-gray-300 cursor-not-allowed"
                                                        : "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white hover:shadow-xl"
                                                    }`}
                                            >
                                                {isPolkadotMinting ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                        Minting on Rococo...
                                                    </span>
                                                ) : !polkadot.connected ? (
                                                    "Connect Polkadot First"
                                                ) : !stellar.address ? (
                                                    "Connect Stellar First"
                                                ) : (
                                                    "🔗 Mint Polkadot SBT"
                                                )}
                                            </button>
                                        )}

                                        <p className="text-xs text-gray-500 text-center">
                                            Mint your cross-chain SBT on Polkadot Rococo testnet. Links to your Stellar reputation.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Error Display */}
                    {scanError && !reputationData && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-center">
                            <p className="text-red-700">{scanError}</p>
                            <button
                                onClick={() => setScanError(null)}
                                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Dashboard;
