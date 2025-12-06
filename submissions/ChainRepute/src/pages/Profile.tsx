import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
    getTierFromScore,
    REWARD_TIERS,
    type TierInfo,
    type ChainScoreBreakdown,
} from "../services/api";
import { useWallet, truncateAddress } from "../wallet/WalletContext";

// ============================================
// Demo Data for Elite User Profile
// ============================================

const DEMO_PROFILE = {
    overallScore: 912,
    stellar: {
        address: "GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI",
        score: 467,
        scoreBreakdown: {
            volumeScore: 95,
            uniqueRecipientsScore: 88,
            frequencyScore: 92,
            accountAgeScore: 98,
            diversityScore: 94,
        } as ChainScoreBreakdown,
        transactionCount: 1247,
        totalVolume: 52340,
        uniqueRecipients: 203,
        accountAge: 847,
        assetDiversity: 12,
    },
    polkadot: {
        address: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
        score: 445,
        scoreBreakdown: {
            volumeScore: 90,
            uniqueRecipientsScore: 85,
            frequencyScore: 88,
            accountAgeScore: 95,
            diversityScore: 87,
        } as ChainScoreBreakdown,
        governanceVotes: 47,
        stakingAmount: 15420,
        uniqueRecipients: 156,
        accountAge: 723,
        validatorNominations: 16,
        identityVerified: true,
    },
    profile: "Balanced" as const,
    badges: ["DeFi Native", "Governance Pro", "Diamond Hands", "Cross-Chain Pioneer", "Trusted Validator"],
    joinedDate: "2022-03-15",
};

// ============================================
// Score Ring Component
// ============================================

const ScoreRing = ({ score, maxScore = 1000, size = "large" }: { score: number; maxScore?: number; size?: "small" | "large" }) => {
    const percentage = (score / maxScore) * 100;
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const sizeClass = size === "large" ? "w-48 h-48" : "w-24 h-24";
    const textSize = size === "large" ? "text-5xl" : "text-xl";

    return (
        <div className={`relative ${sizeClass}`}>
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="url(#profileGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000 ease-out"
                />
                <defs>
                    <linearGradient id="profileGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f43f5e" />
                        <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`${textSize} font-bold text-gray-900`}>{score}</span>
                <span className="text-sm text-gray-500">/ {maxScore}</span>
            </div>
        </div>
    );
};

// ============================================
// Tier Progress Component
// ============================================

const TierProgress = ({ currentScore, currentTier }: { currentScore: number; currentTier: TierInfo }) => {
    const nextTier = REWARD_TIERS.find(t => t.tier === (currentTier.tier as number) + 1);

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <span className="text-4xl">{currentTier.badgeEmoji}</span>
                    <div>
                        <h3 className="font-bold text-gray-900">Tier {currentTier.tier}: {currentTier.name}</h3>
                        <p className="text-sm text-gray-500">{currentTier.badge} Badge Holder</p>
                    </div>
                </div>
                {nextTier && (
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Next: {nextTier.name}</p>
                        <p className="font-semibold text-rose-600">{nextTier.minScore - currentScore} pts to go</p>
                    </div>
                )}
            </div>

            {nextTier && (
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>{currentTier.minScore}</span>
                        <span>{nextTier.minScore}</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-rose-400 to-pink-500 rounded-full transition-all duration-500"
                            style={{
                                width: `${((currentScore - currentTier.minScore) / (nextTier.minScore - currentTier.minScore)) * 100}%`,
                            }}
                        />
                    </div>
                </div>
            )}

            {!nextTier && (
                <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg p-3 text-center">
                    <p className="text-rose-600 font-medium">🏆 Maximum Tier Achieved!</p>
                </div>
            )}
        </div>
    );
};

// ============================================
// Chain Stats Card
// ============================================

const ChainStatsCard = ({
    chain,
    address,
    score,
    breakdown,
    stats,
}: {
    chain: "stellar" | "polkadot";
    address: string;
    score: number;
    breakdown: ChainScoreBreakdown;
    stats: Record<string, string | number>;
}) => {
    const chainConfig = {
        stellar: { name: "Stellar", icon: "⭐", color: "from-gray-700 to-gray-900" },
        polkadot: { name: "Polkadot", icon: "⚫", color: "from-pink-500 to-rose-600" },
    };
    const config = chainConfig[chain];

    const params = [
        { label: "Volume", value: breakdown.volumeScore, icon: "💰" },
        { label: "Recipients", value: breakdown.uniqueRecipientsScore, icon: "👥" },
        { label: "Frequency", value: breakdown.frequencyScore, icon: "📊" },
        { label: "Age", value: breakdown.accountAgeScore, icon: "📅" },
        { label: "Diversity", value: breakdown.diversityScore, icon: "🎯" },
    ];

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className={`bg-gradient-to-r ${config.color} px-5 py-4 text-white`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">{config.icon}</span>
                        <span className="font-semibold">{config.name}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold">{score}</span>
                        <span className="text-sm opacity-80"> / 500</span>
                    </div>
                </div>
                <p className="text-xs opacity-70 mt-1 font-mono">{truncateAddress(address, 8, 8)}</p>
            </div>

            <div className="p-5">
                {/* Score breakdown bars */}
                <div className="space-y-3 mb-5">
                    {params.map((param) => (
                        <div key={param.label} className="flex items-center gap-3">
                            <span className="w-6 text-center">{param.icon}</span>
                            <div className="flex-1">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-600">{param.label}</span>
                                    <span className="font-medium">{param.value}/100</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full bg-gradient-to-r ${config.color} rounded-full`}
                                        style={{ width: `${param.value}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Raw stats */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                    {Object.entries(stats).map(([key, value]) => (
                        <div key={key} className="text-sm">
                            <span className="text-gray-500">{key}</span>
                            <p className="font-semibold text-gray-900">{value}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ============================================
// Badges Grid
// ============================================

const BadgesGrid = ({ badges }: { badges: string[] }) => (
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            🏅 Earned Badges
        </h3>
        <div className="flex flex-wrap gap-2">
            {badges.map((badge, i) => (
                <span
                    key={i}
                    className="px-4 py-2 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-full text-sm font-medium text-rose-700"
                >
                    {badge}
                </span>
            ))}
        </div>
    </div>
);

// ============================================
// Unlocked Perks Component
// ============================================

const UnlockedPerks = ({ tier }: { tier: TierInfo }) => (
    <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-6 border border-rose-200">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            🎁 Your Unlocked Rewards
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
            <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Rewards</h4>
                <ul className="space-y-2">
                    {tier.rewards.map((reward, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                            <span className="text-emerald-500">✓</span>
                            <span>{reward}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Perks</h4>
                <ul className="space-y-2">
                    {tier.perks.map((perk, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                            <span className="text-blue-500">★</span>
                            <span>{perk}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    </div>
);

// ============================================
// Use Cases Demo Section
// ============================================

const UseCasesDemo = ({ score }: { score: number }) => {
    const tier = getTierFromScore(score);
    const isHighRep = score >= 600;

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                🚀 What Your Reputation Unlocks
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
                {/* Undercollateralized Lending */}
                <div className={`p-4 rounded-xl border-2 ${isHighRep ? "border-emerald-200 bg-emerald-50" : "border-gray-200 bg-gray-50"}`}>
                    <div className="text-2xl mb-2">🏦</div>
                    <h4 className="font-medium text-gray-900">DeFi Loans</h4>
                    <p className="text-sm text-gray-600 mb-3">Collateral requirement</p>
                    <div className={`text-2xl font-bold ${isHighRep ? "text-emerald-600" : "text-gray-400"}`}>
                        {isHighRep ? "75%" : "150%"}
                    </div>
                    <p className="text-xs text-gray-500">
                        {isHighRep ? "Reduced from 150% standard" : "Standard requirement"}
                    </p>
                </div>

                {/* DAO Voting Power */}
                <div className={`p-4 rounded-xl border-2 ${isHighRep ? "border-purple-200 bg-purple-50" : "border-gray-200 bg-gray-50"}`}>
                    <div className="text-2xl mb-2">🗳️</div>
                    <h4 className="font-medium text-gray-900">DAO Voting</h4>
                    <p className="text-sm text-gray-600 mb-3">Voting power multiplier</p>
                    <div className={`text-2xl font-bold ${isHighRep ? "text-purple-600" : "text-gray-400"}`}>
                        {tier.tier >= 4 ? "3x" : tier.tier >= 3 ? "2x" : "1x"}
                    </div>
                    <p className="text-xs text-gray-500">
                        Based on Tier {tier.tier} status
                    </p>
                </div>

                {/* Community Access */}
                <div className={`p-4 rounded-xl border-2 ${score >= 400 ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-gray-50"}`}>
                    <div className="text-2xl mb-2">🎭</div>
                    <h4 className="font-medium text-gray-900">Exclusive Access</h4>
                    <p className="text-sm text-gray-600 mb-3">Communities unlocked</p>
                    <div className={`text-2xl font-bold ${score >= 400 ? "text-blue-600" : "text-gray-400"}`}>
                        {tier.tier >= 5 ? "VIP" : tier.tier >= 3 ? "Premium" : "Basic"}
                    </div>
                    <p className="text-xs text-gray-500">
                        {tier.tier >= 5 ? "All communities" : tier.tier >= 3 ? "Most communities" : "Public only"}
                    </p>
                </div>
            </div>
        </div>
    );
};

// ============================================
// SBT Minting Section
// ============================================

const SBTMintingSection = ({ score, hasMinted }: { score: number; hasMinted: boolean }) => {
    const [isMinting, setIsMinting] = useState(false);
    const [minted, setMinted] = useState(hasMinted);

    const handleMint = async () => {
        setIsMinting(true);
        // Simulate minting delay
        await new Promise(r => setTimeout(r, 2000));
        setMinted(true);
        setIsMinting(false);
    };

    return (
        <div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-xl mb-1">🎖️ Soulbound Token (SBT)</h3>
                    <p className="text-rose-100 text-sm">
                        Mint your reputation as a non-transferable credential on-chain
                    </p>
                </div>
                {!minted ? (
                    <button
                        onClick={handleMint}
                        disabled={isMinting || score < 200}
                        className={`px-6 py-3 rounded-full font-semibold transition-all ${isMinting
                            ? "bg-white/30 cursor-wait"
                            : score < 200
                                ? "bg-white/20 cursor-not-allowed"
                                : "bg-white text-rose-600 hover:bg-rose-50 hover:scale-105"
                            }`}
                    >
                        {isMinting ? "Minting..." : score < 200 ? "Need 200+ score" : "Mint SBT"}
                    </button>
                ) : (
                    <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                        <span className="text-emerald-300">✓</span>
                        <span>SBT Minted</span>
                    </div>
                )}
            </div>
            {minted && (
                <div className="mt-4 pt-4 border-t border-white/20">
                    <p className="text-sm text-rose-100">
                        Your reputation credential is now verifiable on Polkadot. Use it to prove your cross-chain reputation to any dApp.
                    </p>
                </div>
            )}
        </div>
    );
};

// ============================================
// Profile Page Component
// ============================================

const Profile = () => {
    const { stellar, polkadot, isDemoMode } = useWallet();

    // Determine profile data based on demo mode or connection status
    const profileData = useMemo(() => {
        if (isDemoMode || (!stellar.connected && !polkadot.connected)) {
            return DEMO_PROFILE;
        }
        return null;
    }, [isDemoMode, stellar.connected, polkadot.connected]);

    // If no profile data, show prompt to scan
    if (!profileData && !isDemoMode) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
                <Navbar />
                <main className="pt-24 pb-16 px-6">
                    <div className="max-w-2xl mx-auto text-center">
                        <div className="bg-white rounded-2xl shadow-xl p-10 border border-rose-100">
                            <div className="text-6xl mb-4">👤</div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-3">No Profile Yet</h1>
                            <p className="text-gray-600 mb-6">
                                Connect your wallets and scan your reputation to create your profile.
                            </p>
                            <Link
                                to="/dashboard"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-medium rounded-full hover:from-rose-600 hover:to-pink-700 transition-all"
                            >
                                Scan My Reputation →
                            </Link>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const data = profileData || DEMO_PROFILE;
    const currentTier = getTierFromScore(data.overallScore);

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
            <Navbar />

            <main className="pt-24 pb-16 px-6">
                <div className="max-w-5xl mx-auto">
                    {/* Demo Mode Banner */}
                    {isDemoMode && (
                        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-center">
                            <span className="text-amber-800 text-sm">
                                👑 Viewing Demo Elite Profile - This shows what a top-tier user looks like
                            </span>
                        </div>
                    )}

                    {/* Profile Header */}
                    <div className="bg-white rounded-2xl shadow-xl border border-rose-100 overflow-hidden mb-6">
                        <div className="bg-gradient-to-r from-rose-500 to-pink-600 px-8 py-6">
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                {/* Score Ring */}
                                <div className="bg-white rounded-full p-2">
                                    <ScoreRing score={data.overallScore} />
                                </div>

                                {/* Profile Info */}
                                <div className="text-white text-center md:text-left flex-1">
                                    <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                                        <span className="text-4xl">{currentTier.badgeEmoji}</span>
                                        <div>
                                            <h1 className="text-2xl font-bold">
                                                Tier {currentTier.tier}: {currentTier.name}
                                            </h1>
                                            <p className="text-rose-100">
                                                {currentTier.badge} Badge Holder
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-rose-100 text-sm">
                                        Member since {new Date(data.joinedDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                    </p>
                                </div>

                                {/* Share Button */}
                                <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full text-white text-sm transition-all">
                                    📤 Share Profile
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tier Progress */}
                    <div className="mb-6">
                        <TierProgress currentScore={data.overallScore} currentTier={currentTier} />
                    </div>

                    {/* Chain Stats */}
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <ChainStatsCard
                            chain="stellar"
                            address={data.stellar.address}
                            score={data.stellar.score}
                            breakdown={data.stellar.scoreBreakdown}
                            stats={{
                                "Transactions": data.stellar.transactionCount.toLocaleString(),
                                "Volume": `${(data.stellar.totalVolume / 1000).toFixed(1)}K XLM`,
                                "Recipients": data.stellar.uniqueRecipients,
                                "Account Age": `${data.stellar.accountAge} days`,
                            }}
                        />
                        <ChainStatsCard
                            chain="polkadot"
                            address={data.polkadot.address}
                            score={data.polkadot.score}
                            breakdown={data.polkadot.scoreBreakdown}
                            stats={{
                                "Gov Votes": data.polkadot.governanceVotes,
                                "Staked": `${(data.polkadot.stakingAmount / 1000).toFixed(1)}K DOT`,
                                "Nominations": data.polkadot.validatorNominations,
                                "Identity": data.polkadot.identityVerified ? "Verified ✓" : "Not Verified",
                            }}
                        />
                    </div>

                    {/* Badges */}
                    <div className="mb-6">
                        <BadgesGrid badges={data.badges} />
                    </div>

                    {/* Unlocked Perks */}
                    <div className="mb-6">
                        <UnlockedPerks tier={currentTier} />
                    </div>

                    {/* Use Cases Demo */}
                    <div className="mb-6">
                        <UseCasesDemo score={data.overallScore} />
                    </div>

                    {/* SBT Minting */}
                    <div className="mb-6">
                        <SBTMintingSection score={data.overallScore} hasMinted={false} />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Profile;
