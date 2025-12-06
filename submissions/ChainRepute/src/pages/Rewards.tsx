import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { REWARD_TIERS, getTierFromScore, type TierInfo } from "../services/api";
import { useWallet } from "../wallet/WalletContext";
import { verifyOwnership, getReputation, type SBTReputation } from "../services/reputation";

// ============================================
// Tier Card Component
// ============================================

const TierCard = ({ tier, isCurrentTier, isUnlocked }: { tier: TierInfo; isCurrentTier: boolean; isUnlocked: boolean }) => {
    const colorClasses: Record<string, { bg: string; border: string; text: string; badge: string }> = {
        amber: {
            bg: "bg-gradient-to-br from-amber-50 to-orange-50",
            border: "border-amber-200",
            text: "text-amber-700",
            badge: "from-amber-400 to-amber-600",
        },
        slate: {
            bg: "bg-gradient-to-br from-slate-50 to-gray-100",
            border: "border-slate-300",
            text: "text-slate-700",
            badge: "from-slate-400 to-slate-600",
        },
        yellow: {
            bg: "bg-gradient-to-br from-yellow-50 to-amber-50",
            border: "border-yellow-300",
            text: "text-yellow-700",
            badge: "from-yellow-400 to-yellow-600",
        },
        cyan: {
            bg: "bg-gradient-to-br from-cyan-50 to-blue-50",
            border: "border-cyan-300",
            text: "text-cyan-700",
            badge: "from-cyan-400 to-cyan-600",
        },
        rose: {
            bg: "bg-gradient-to-br from-rose-50 to-pink-50",
            border: "border-rose-300",
            text: "text-rose-700",
            badge: "from-rose-400 to-pink-600",
        },
    };

    const colors = colorClasses[tier.color] || colorClasses.amber;

    return (
        <div
            className={`relative rounded-2xl border-2 ${colors.border} ${colors.bg} overflow-hidden transition-all duration-300 ${isCurrentTier ? "ring-4 ring-rose-400 ring-offset-2 scale-105" : ""
                } ${!isUnlocked ? "opacity-60" : ""}`}
        >
            {/* Current Tier Badge */}
            {isCurrentTier && (
                <div className="absolute top-0 right-0 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    YOUR TIER
                </div>
            )}

            {/* Header */}
            <div className="p-6 text-center border-b border-gray-200">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br ${colors.badge} text-white text-3xl mb-3`}>
                    {tier.badgeEmoji}
                </div>
                <h3 className={`text-xl font-bold ${colors.text}`}>Tier {tier.tier}: {tier.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                    {tier.minScore} - {tier.maxScore} points
                </p>
            </div>

            {/* Rewards */}
            <div className="p-5">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">🎁 Rewards</h4>
                <ul className="space-y-2">
                    {tier.rewards.map((reward, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                            <span className={isUnlocked ? "text-emerald-500" : "text-gray-400"}>
                                {isUnlocked ? "✓" : "○"}
                            </span>
                            <span className={isUnlocked ? "text-gray-700" : "text-gray-400"}>{reward}</span>
                        </li>
                    ))}
                </ul>

                <h4 className="text-sm font-semibold text-gray-900 mb-3 mt-4">⚡ Perks</h4>
                <ul className="space-y-2">
                    {tier.perks.map((perk, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                            <span className={isUnlocked ? "text-blue-500" : "text-gray-400"}>
                                {isUnlocked ? "★" : "☆"}
                            </span>
                            <span className={isUnlocked ? "text-gray-700" : "text-gray-400"}>{perk}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Lock overlay for unearned tiers */}
            {!isUnlocked && (
                <div className="absolute inset-0 bg-white/40 flex items-center justify-center">
                    <div className="bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-medium">
                        🔒 {tier.minScore}+ pts to unlock
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================
// How It Works Section
// ============================================

const HowItWorks = () => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📊 How Scoring Works</h2>

        <div className="grid md:grid-cols-2 gap-6">
            {/* Scoring Breakdown */}
            <div>
                <h3 className="font-semibold text-gray-800 mb-3">Score = Stellar (500) + Polkadot (500) = 1000 max</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Your reputation is calculated from 5 parameters on each chain:
                </p>
                <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                        <span className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">💰</span>
                        <div>
                            <span className="font-medium">Volume</span>
                            <span className="text-gray-500"> - Total value transacted</span>
                        </div>
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">👥</span>
                        <div>
                            <span className="font-medium">Unique Recipients</span>
                            <span className="text-gray-500"> - Addresses you've interacted with</span>
                        </div>
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">📊</span>
                        <div>
                            <span className="font-medium">Frequency</span>
                            <span className="text-gray-500"> - How often you transact</span>
                        </div>
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">📅</span>
                        <div>
                            <span className="font-medium">Account Age</span>
                            <span className="text-gray-500"> - Time on the blockchain</span>
                        </div>
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">🎯</span>
                        <div>
                            <span className="font-medium">Diversity</span>
                            <span className="text-gray-500"> - Variety of activities</span>
                        </div>
                    </li>
                </ul>
            </div>

            {/* Anti-Gaming */}
            <div>
                <h3 className="font-semibold text-gray-800 mb-3">🛡️ Anti-Gaming Measures</h3>
                <p className="text-sm text-gray-600 mb-4">
                    We've designed the scoring to reward genuine activity:
                </p>
                <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                        <span className="text-red-500">✗</span>
                        <div>
                            <span className="font-medium text-gray-700">Self-transfers don't count</span>
                            <p className="text-gray-500 text-xs">Sending to yourself won't boost unique recipients</p>
                        </div>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-red-500">✗</span>
                        <div>
                            <span className="font-medium text-gray-700">Spam farming is detected</span>
                            <p className="text-gray-500 text-xs">Frequency without diversity scores poorly</p>
                        </div>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-emerald-500">✓</span>
                        <div>
                            <span className="font-medium text-gray-700">Long-term activity rewarded</span>
                            <p className="text-gray-500 text-xs">Account age and consistent behavior earn more</p>
                        </div>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-emerald-500">✓</span>
                        <div>
                            <span className="font-medium text-gray-700">Cross-chain verified</span>
                            <p className="text-gray-500 text-xs">Activity on both chains is harder to fake</p>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </div>
);

// ============================================
// Rewards Page Component
// ============================================

const Rewards = () => {
    const { isDemoMode, stellar } = useWallet();
    const [selectedScore] = useState(isDemoMode ? 912 : 0);
    const [hasSBT, setHasSBT] = useState<boolean>(false);
    const [sbtData, setSbtData] = useState<SBTReputation | null>(null);
    const [isLoadingSBT, setIsLoadingSBT] = useState<boolean>(false);

    // Check for SBT on wallet connection
    useEffect(() => {
        const checkSBT = async () => {
            if (stellar.connected && stellar.address) {
                setIsLoadingSBT(true);
                try {
                    const ownership = await verifyOwnership(stellar.address);
                    setHasSBT(ownership);

                    if (ownership) {
                        const sbtInfo = await getReputation(stellar.address);
                        setSbtData(sbtInfo);
                    }
                } catch (err) {
                    console.error("Error checking SBT:", err);
                } finally {
                    setIsLoadingSBT(false);
                }
            }
        };

        checkSBT();
    }, [stellar.connected, stellar.address]);

    // For demo, show a high-tier user
    const currentTier = getTierFromScore(sbtData?.score || selectedScore);

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
            <Navbar />

            <main className="pt-24 pb-16 px-6">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                            🏆 Reward Tiers
                        </h1>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Build your cross-chain reputation to unlock exclusive rewards, discounts, and perks.
                            Higher scores mean better benefits!
                        </p>

                        {/* SBT Status Banner */}
                        {stellar.connected && (
                            <div className="mt-6">
                                {isLoadingSBT ? (
                                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-full">
                                        <svg className="animate-spin h-4 w-4 text-gray-600" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span className="text-gray-600">Checking SBT...</span>
                                    </div>
                                ) : hasSBT && sbtData ? (
                                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full shadow-lg">
                                        <span className="text-2xl">✅</span>
                                        <div className="text-left">
                                            <div className="font-bold">SBT Active</div>
                                            <div className="text-xs opacity-90">
                                                Tier {currentTier.tier} • Score: {sbtData.score}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="inline-flex flex-col items-center gap-3 px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl">
                                        <div className="flex items-center gap-2 text-amber-900">
                                            <span className="text-2xl">🎖️</span>
                                            <span className="font-bold">Mint Your Reputation SBT</span>
                                        </div>
                                        <Link
                                            to="/dashboard"
                                            className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-medium rounded-lg hover:from-rose-600 hover:to-pink-700 transition-all shadow-md text-sm"
                                        >
                                            Scan & Mint Now →
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* CTA */}
                        {!stellar.connected && (
                            <div className="mt-6">
                                <Link
                                    to="/dashboard"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-medium rounded-full hover:from-rose-600 hover:to-pink-700 transition-all shadow-lg"
                                >
                                    Check Your Score →
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* How It Works */}
                    <HowItWorks />

                    {/* Tier Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        {REWARD_TIERS.map((tier) => (
                            <TierCard
                                key={tier.tier}
                                tier={tier}
                                isCurrentTier={currentTier.tier === tier.tier && (sbtData?.score || selectedScore) > 0}
                                isUnlocked={(sbtData?.score || selectedScore) >= tier.minScore}
                            />
                        ))}
                    </div>

                    {/* Tier 5 Special Highlight */}
                    <div className="mt-12 bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl p-8 text-white text-center">
                        <h2 className="text-2xl font-bold mb-4">👑 Reach Elite Tier 5</h2>
                        <p className="text-rose-100 max-w-2xl mx-auto mb-6">
                            The top 5% of users unlock exclusive benefits including the coveted Twitter/X Affiliate Badge,
                            a unique Elite NFT, and revenue sharing opportunities.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-full text-sm">
                                🐦 Twitter Affiliate Badge
                            </div>
                            <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-full text-sm">
                                🎨 Exclusive Elite NFT
                            </div>
                            <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-full text-sm">
                                💰 Revenue Sharing
                            </div>
                            <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-full text-sm">
                                🗳️ Governance Rights
                            </div>
                        </div>
                    </div>

                    {/* FAQ Section */}
                    <div className="mt-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">❓ Frequently Asked Questions</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl p-5 border border-gray-200">
                                <h3 className="font-semibold text-gray-900 mb-2">How do I increase my score?</h3>
                                <p className="text-sm text-gray-600">
                                    Use both Stellar and Polkadot chains regularly. Vote in governance, stake tokens,
                                    transact with different addresses, and hold diverse assets.
                                </p>
                            </div>
                            <div className="bg-white rounded-xl p-5 border border-gray-200">
                                <h3 className="font-semibold text-gray-900 mb-2">How often is my score updated?</h3>
                                <p className="text-sm text-gray-600">
                                    Your score updates every time you scan. We recommend scanning weekly to track
                                    your progress and unlock new rewards.
                                </p>
                            </div>
                            <div className="bg-white rounded-xl p-5 border border-gray-200">
                                <h3 className="font-semibold text-gray-900 mb-2">What are the partner discounts?</h3>
                                <p className="text-sm text-gray-600">
                                    We partner with DeFi protocols, NFT marketplaces, and Web3 services to offer
                                    exclusive discounts based on your tier level.
                                </p>
                            </div>
                            <div className="bg-white rounded-xl p-5 border border-gray-200">
                                <h3 className="font-semibold text-gray-900 mb-2">How do I claim my NFT badge?</h3>
                                <p className="text-sm text-gray-600">
                                    Once you reach a qualifying tier, visit your profile page to mint your
                                    Soulbound Token (SBT) badge directly to your wallet.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Rewards;
