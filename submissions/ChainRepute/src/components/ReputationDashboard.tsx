import {
    type ReputationData,
    type ChainScoreBreakdown,
    getScoreColor,
    getScoreLabel,
    formatNumber,
    getProfileColor,
    getTierFromScore,
    REWARD_TIERS,
} from "../services/api";

// ============================================
// Props Interface
// ============================================

interface ReputationDashboardProps {
    data: ReputationData;
    onRescan?: () => void;
}

// ============================================
// Score Gauge Component
// ============================================

const ScoreGauge = ({ score, maxScore = 1000 }: { score: number; maxScore?: number }) => {
    const percentage = (score / maxScore) * 100;
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative w-40 h-40">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#f3f4f6"
                    strokeWidth="8"
                />
                {/* Progress circle */}
                <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000 ease-out"
                />
                {/* Gradient definition */}
                <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f43f5e" />
                        <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                </defs>
            </svg>
            {/* Score text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">{score}</span>
                <span className="text-sm text-gray-500">/ {maxScore}</span>
            </div>
        </div>
    );
};

// ============================================
// 5-Param Score Bar Component (NEW)
// ============================================

const ParamScoreBar = ({
    label,
    value,
    maxValue = 100,
    icon,
    color,
    description,
}: {
    label: string;
    value: number;
    maxValue?: number;
    icon: string;
    color: string;
    description: string;
}) => {
    const percentage = (value / maxValue) * 100;

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                    <span>{icon}</span>
                    <span className="text-gray-700 font-medium">{label}</span>
                </div>
                <span className="font-semibold text-gray-900">
                    {value} / {maxValue}
                </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={`h-full ${color} rounded-full transition-all duration-700`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <p className="text-xs text-gray-500">{description}</p>
        </div>
    );
};

// ============================================
// Chain Score Breakdown Component (NEW)
// ============================================

const ChainScoreBreakdownCard = ({
    title,
    icon,
    breakdown,
    totalScore,
    maxScore = 500,
    chainColor,
}: {
    title: string;
    icon: React.ReactNode;
    breakdown: ChainScoreBreakdown;
    totalScore: number;
    maxScore?: number;
    chainColor: string;
}) => {
    const params = [
        {
            label: "Volume",
            value: breakdown.volumeScore,
            icon: "💰",
            color: "bg-emerald-500",
            description: "Total value transacted on-chain",
        },
        {
            label: "Unique Recipients",
            value: breakdown.uniqueRecipientsScore,
            icon: "👥",
            color: "bg-blue-500",
            description: "Distinct addresses interacted with (anti-gaming)",
        },
        {
            label: "Frequency",
            value: breakdown.frequencyScore,
            icon: "📊",
            color: "bg-purple-500",
            description: "How consistently you transact",
        },
        {
            label: "Account Age",
            value: breakdown.accountAgeScore,
            icon: "📅",
            color: "bg-amber-500",
            description: "How long your account has been active",
        },
        {
            label: "Diversity",
            value: breakdown.diversityScore,
            icon: "🎯",
            color: "bg-pink-500",
            description: "Variety of on-chain activities",
        },
    ];

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className={`${chainColor} px-5 py-4 border-b border-gray-100`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {icon}
                        <span className="font-semibold text-gray-900">{title}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-gray-900">{totalScore}</span>
                        <span className="text-sm text-gray-500"> / {maxScore}</span>
                    </div>
                </div>
            </div>
            <div className="p-5 space-y-4">
                {params.map((param, index) => (
                    <ParamScoreBar key={index} {...param} />
                ))}
            </div>
        </div>
    );
};

// ============================================
// Tier Badge Component (NEW)
// ============================================

const TierBadge = ({ score }: { score: number }) => {
    const tier = getTierFromScore(score);

    const colorClasses: Record<string, string> = {
        amber: "from-amber-400 to-amber-600 border-amber-300",
        slate: "from-slate-400 to-slate-600 border-slate-300",
        yellow: "from-yellow-400 to-yellow-600 border-yellow-300",
        cyan: "from-cyan-400 to-cyan-600 border-cyan-300",
        rose: "from-rose-400 to-rose-600 border-rose-300",
    };

    return (
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${colorClasses[tier.color]} border-2 shadow-lg`}>
            <span className="text-2xl">{tier.badgeEmoji}</span>
            <div className="text-white">
                <div className="font-bold text-sm">Tier {tier.tier}</div>
                <div className="text-xs opacity-90">{tier.name}</div>
            </div>
        </div>
    );
};

// ============================================
// Rewards Preview Component (NEW)
// ============================================

const RewardsPreview = ({ score }: { score: number }) => {
    const currentTier = getTierFromScore(score);
    const nextTier = REWARD_TIERS.find(t => t.tier === (currentTier.tier as number) + 1);
    const pointsToNext = nextTier ? nextTier.minScore - score : 0;

    return (
        <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-5 border border-rose-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                🎁 Your Rewards
            </h3>

            {/* Current tier rewards */}
            <div className="space-y-3 mb-4">
                {currentTier.rewards.map((reward, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="text-emerald-500">✓</span>
                        <span className="text-gray-700">{reward}</span>
                    </div>
                ))}
            </div>

            {/* Progress to next tier */}
            {nextTier && (
                <div className="pt-4 border-t border-rose-200">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Next: Tier {nextTier.tier} {nextTier.name}</span>
                        <span className="font-medium text-rose-600">{pointsToNext} pts to go</span>
                    </div>
                    <div className="h-2 bg-rose-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-rose-400 to-pink-500 rounded-full"
                            style={{
                                width: `${((score - currentTier.minScore) / (nextTier.minScore - currentTier.minScore)) * 100}%`,
                            }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Unlock: {nextTier.rewards[0]}
                    </p>
                </div>
            )}

            {!nextTier && (
                <div className="pt-4 border-t border-rose-200">
                    <p className="text-sm text-emerald-600 font-medium">
                        🏆 You've reached the highest tier! Maximum rewards unlocked.
                    </p>
                </div>
            )}
        </div>
    );
};

// ============================================
// Vouchers & Perks Section (NEW)
// ============================================

interface VoucherCardProps {
    title: string;
    description: string;
    discount: string;
    partner: string;
    icon: string;
    unlocked: boolean;
    minTier: number;
}

const VoucherCard = ({ title, discount, partner, icon, unlocked, minTier }: VoucherCardProps) => (
    <div className={`relative p-4 rounded-xl border-2 transition-all ${unlocked
        ? "border-emerald-200 bg-white hover:border-emerald-300 hover:shadow-md"
        : "border-gray-200 bg-gray-50 opacity-60"
        }`}>
        {!unlocked && (
            <div className="absolute top-2 right-2">
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                    Tier {minTier}+
                </span>
            </div>
        )}
        <div className="flex items-start gap-3">
            <span className="text-3xl">{icon}</span>
            <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{title}</h4>
                <p className="text-xs text-gray-500 mb-2">{partner}</p>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${unlocked
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-500"
                    }`}>
                    {discount}
                </div>
            </div>
        </div>
        {unlocked && (
            <button className="mt-3 w-full py-2 text-sm font-medium text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors">
                Claim Voucher
            </button>
        )}
    </div>
);

const VouchersSection = ({ score }: { score: number }) => {
    const currentTier = getTierFromScore(score);

    const vouchers: VoucherCardProps[] = [
        {
            title: "Gas Fee Rebate",
            description: "Get rebate on transaction fees",
            discount: "5% Rebate",
            partner: "ChainRepute",
            icon: "⛽",
            unlocked: currentTier.tier >= 2,
            minTier: 2,
        },
        {
            title: "Partner DEX Discount",
            description: "Reduced trading fees on partner DEX",
            discount: "10% Off Fees",
            partner: "StellarX",
            icon: "💱",
            unlocked: currentTier.tier >= 3,
            minTier: 3,
        },
        {
            title: "NFT Marketplace Credits",
            description: "Credits for NFT purchases",
            discount: "$25 Credit",
            partner: "Polkadot NFTs",
            icon: "🎨",
            unlocked: currentTier.tier >= 3,
            minTier: 3,
        },
        {
            title: "Premium Analytics",
            description: "Access to advanced chain analytics",
            discount: "1 Month Free",
            partner: "ChainWatch Pro",
            icon: "📊",
            unlocked: currentTier.tier >= 4,
            minTier: 4,
        },
        {
            title: "Hardware Wallet Discount",
            description: "Discount on hardware wallet",
            discount: "20% Off",
            partner: "Ledger",
            icon: "🔐",
            unlocked: currentTier.tier >= 4,
            minTier: 4,
        },
        {
            title: "Exclusive Event Access",
            description: "VIP access to blockchain events",
            discount: "Free Pass",
            partner: "ChainRepute Events",
            icon: "🎟️",
            unlocked: currentTier.tier >= 5,
            minTier: 5,
        },
    ];

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            🎫 Available Vouchers & Perks
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {vouchers.filter(v => v.unlocked).length} of {vouchers.length} unlocked
                        </p>
                    </div>
                    <a
                        href="/rewards"
                        className="text-sm text-rose-600 hover:text-rose-700 font-medium"
                    >
                        View All →
                    </a>
                </div>
            </div>
            <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vouchers.map((voucher, i) => (
                        <VoucherCard key={i} {...voucher} />
                    ))}
                </div>
            </div>
        </div>
    );
};

// ============================================
// ReputationDashboard Component
// ============================================

const ReputationDashboard = ({ data, onRescan }: ReputationDashboardProps) => {
    const { overallScore, profile, stellar, polkadot, aiInsights } = data;

    // Stellar Logo SVG
    const StellarIcon = (
        <svg className="w-6 h-6 text-gray-800" viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 0L20.944 9.056 30.144 11.056 23.488 18.944 24.832 28.288 16 24 7.168 28.288 8.512 18.944 1.856 11.056 11.056 9.056z" />
        </svg>
    );

    // Polkadot Logo SVG
    const PolkadotIcon = (
        <svg className="w-6 h-6 text-pink-600" viewBox="0 0 32 32" fill="currentColor">
            <circle cx="16" cy="6" r="4" />
            <circle cx="16" cy="26" r="4" />
            <circle cx="6" cy="11" r="4" />
            <circle cx="26" cy="11" r="4" />
            <circle cx="6" cy="21" r="4" />
            <circle cx="26" cy="21" r="4" />
            <circle cx="16" cy="16" r="3" />
        </svg>
    );

    return (
        <div className="space-y-6">
            {/* Main Score Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-rose-100 overflow-hidden">
                <div className="bg-gradient-to-r from-rose-50 to-pink-50 px-6 py-4 border-b border-rose-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-rose-900">Your Reputation Score</h2>
                            <p className="text-sm text-rose-600 mt-1">Cross-chain reputation analysis complete</p>
                        </div>
                        {onRescan && (
                            <button
                                onClick={onRescan}
                                className="px-4 py-2 text-sm bg-white border border-rose-200 text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
                            >
                                Rescan
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-6">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        {/* Score Gauge */}
                        <div className="flex flex-col items-center">
                            <ScoreGauge score={overallScore} />
                            <div className="mt-4 text-center space-y-2">
                                <span
                                    className={`text-lg font-semibold ${getScoreColor(overallScore)}`}
                                >
                                    {getScoreLabel(overallScore)}
                                </span>
                                <div>
                                    <TierBadge score={overallScore} />
                                </div>
                            </div>
                        </div>

                        {/* Profile and Summary */}
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-3">
                                <span
                                    className={`px-3 py-1 rounded-full text-sm font-medium ${getProfileColor(
                                        profile
                                    )}`}
                                >
                                    {profile}
                                </span>
                                <span className="text-sm text-gray-500">
                                    {aiInsights.confidence}% confidence
                                </span>
                            </div>

                            <p className="text-gray-700">{aiInsights.summary}</p>

                            {/* Strengths */}
                            {aiInsights.strengths.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Strengths</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {aiInsights.strengths.map((strength, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-emerald-50 text-emerald-700 text-sm rounded-full"
                                            >
                                                {strength}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Red Flags */}
                            {aiInsights.redFlags.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Attention</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {aiInsights.redFlags.map((flag, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-red-50 text-red-700 text-sm rounded-full"
                                            >
                                                {flag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Rewards Preview */}
            <RewardsPreview score={overallScore} />

            {/* Vouchers & Perks Section */}
            <VouchersSection score={overallScore} />

            {/* 5-Parameter Chain Score Breakdowns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Stellar 5-Param Breakdown */}
                <ChainScoreBreakdownCard
                    title="Stellar Score"
                    icon={StellarIcon}
                    breakdown={stellar.scoreBreakdown}
                    totalScore={stellar.score}
                    maxScore={500}
                    chainColor="bg-gradient-to-r from-gray-50 to-slate-50"
                />

                {/* Polkadot 5-Param Breakdown */}
                <ChainScoreBreakdownCard
                    title="Polkadot Score"
                    icon={PolkadotIcon}
                    breakdown={polkadot.scoreBreakdown}
                    totalScore={polkadot.score}
                    maxScore={500}
                    chainColor="bg-gradient-to-r from-pink-50 to-rose-50"
                />
            </div>

            {/* Raw Activity Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stellar Activity Stats */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        ⭐ Stellar Activity
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500">Transactions</span>
                            <p className="font-semibold text-gray-900">{stellar.transactionCount}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Volume</span>
                            <p className="font-semibold text-gray-900">{formatNumber(stellar.totalVolume)} XLM</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Unique Recipients</span>
                            <p className="font-semibold text-gray-900">{stellar.uniqueRecipients}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Account Age</span>
                            <p className="font-semibold text-gray-900">{stellar.accountAge} days</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Assets Held</span>
                            <p className="font-semibold text-gray-900">{stellar.assetDiversity}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Payments</span>
                            <p className="font-semibold text-gray-900">{stellar.paymentCount}</p>
                        </div>
                    </div>
                </div>

                {/* Polkadot Activity Stats */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        ⚫ Polkadot Activity
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500">Governance Votes</span>
                            <p className="font-semibold text-gray-900">{polkadot.governanceVotes}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Staked</span>
                            <p className="font-semibold text-gray-900">{formatNumber(polkadot.stakingAmount)} DOT</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Unique Recipients</span>
                            <p className="font-semibold text-gray-900">{polkadot.uniqueRecipients}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Account Age</span>
                            <p className="font-semibold text-gray-900">{polkadot.accountAge} days</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Nominations</span>
                            <p className="font-semibold text-gray-900">{polkadot.validatorNominations}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Identity</span>
                            <p className="font-semibold text-gray-900">{polkadot.identityVerified ? "Verified ✓" : "Not Verified"}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recommendations */}
            {aiInsights.recommendations.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl border border-rose-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-rose-100">
                        <h3 className="text-lg font-semibold text-gray-900">💡 Recommendations</h3>
                        <p className="text-sm text-gray-500 mt-1">Ways to improve your reputation score</p>
                    </div>
                    <div className="p-6">
                        <ul className="space-y-3">
                            {aiInsights.recommendations.map((rec, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-sm font-medium">
                                        {index + 1}
                                    </span>
                                    <span className="text-gray-700">{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Timestamp */}
            <div className="text-center text-sm text-gray-400">
                Last scanned: {new Date(data.timestamp).toLocaleString()}
            </div>
        </div>
    );
};

export default ReputationDashboard;
