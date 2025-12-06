// ============================================
// API Service for ChainRepute
// ============================================

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// ============================================
// Types (matching backend types)
// ============================================

export interface ScanRequest {
  stellarAddress: string;
  polkadotAddress: string;
}

export interface ScanResponse {
  success: boolean;
  data?: ReputationData;
  error?: string;
}

export interface ReputationData {
  overallScore: number;
  profile: ReputationProfile;
  stellar: StellarActivity;
  polkadot: PolkadotActivity;
  breakdown: ScoreBreakdown;
  aiInsights: AIInsights;
  timestamp: number;
}

export type ReputationProfile =
  | "Trader"
  | "Governor"
  | "Staker"
  | "Liquidity Provider"
  | "Balanced"
  | "Newcomer";

// 5-Parameter Scoring (100 points each = 500 per chain)
export interface ChainScoreBreakdown {
  volumeScore: number;           // 0-100: Total token volume transacted
  uniqueRecipientsScore: number; // 0-100: Distinct addresses interacted with
  frequencyScore: number;        // 0-100: Transaction frequency/consistency
  accountAgeScore: number;       // 0-100: How old the account is
  diversityScore: number;        // 0-100: Activity diversity (types of actions)
}

export interface StellarActivity {
  address: string;
  transactionCount: number;
  totalVolume: number;
  liquidityProvided: number;
  accountAge: number;
  assetDiversity: number;
  paymentCount: number;
  uniqueRecipients: number;
  oldestTransaction: string | null;
  scoreBreakdown: ChainScoreBreakdown;
  score: number; // 0-500
}

export interface PolkadotActivity {
  address: string;
  governanceVotes: number;
  stakingAmount: number;
  stakingDuration: number;
  validatorNominations: number;
  parachainInteractions: number;
  accountAge: number;
  identityVerified: boolean;
  uniqueRecipients: number;
  oldestTransaction: string | null;
  scoreBreakdown: ChainScoreBreakdown;
  score: number; // 0-500
}

// Legacy breakdown for AI insights
export interface ScoreBreakdown {
  transactionConsistency: number;
  governanceParticipation: number;
  stakingBehavior: number;
  liquidityProvision: number;
  accountAge: number;
  assetDiversity: number;
}

export interface AIInsights {
  profile: ReputationProfile;
  confidence: number;
  summary: string;
  strengths: string[];
  recommendations: string[];
  redFlags: string[];
}

// ============================================
// Reward Tiers System
// ============================================

export type RewardTier = 1 | 2 | 3 | 4 | 5;

export interface TierInfo {
  tier: RewardTier;
  name: string;
  minScore: number;
  maxScore: number;
  badge: string;
  badgeEmoji: string;
  rewards: string[];
  perks: string[];
  color: string;
}

export const REWARD_TIERS: TierInfo[] = [
  {
    tier: 1,
    name: "Newcomer",
    minScore: 0,
    maxScore: 199,
    badge: "Bronze",
    badgeEmoji: "🥉",
    rewards: ["Basic profile page", "Community access"],
    perks: ["View your cross-chain reputation"],
    color: "amber",
  },
  {
    tier: 2,
    name: "Explorer",
    minScore: 200,
    maxScore: 399,
    badge: "Silver",
    badgeEmoji: "🥈",
    rewards: ["5% partner discounts", "Explorer badge NFT"],
    perks: ["Priority customer support", "Monthly newsletter"],
    color: "slate",
  },
  {
    tier: 3,
    name: "Trusted",
    minScore: 400,
    maxScore: 599,
    badge: "Gold",
    badgeEmoji: "🥇",
    rewards: ["10% partner discounts", "Trusted badge NFT", "DAO voting eligibility"],
    perks: ["Early feature access", "Exclusive Discord channel"],
    color: "yellow",
  },
  {
    tier: 4,
    name: "Diamond",
    minScore: 600,
    maxScore: 799,
    badge: "Diamond",
    badgeEmoji: "💎",
    rewards: ["20% partner discounts", "Diamond badge NFT", "Enhanced DAO voting power"],
    perks: ["Beta tester access", "Direct team communication", "Whitelist priority"],
    color: "cyan",
  },
  {
    tier: 5,
    name: "Elite",
    minScore: 800,
    maxScore: 1000,
    badge: "Elite",
    badgeEmoji: "👑",
    rewards: [
      "30% partner discounts",
      "Exclusive Elite NFT",
      "Twitter/X Affiliate Badge",
      "Maximum DAO voting power",
    ],
    perks: [
      "VIP community access",
      "Partner collaboration opportunities",
      "Revenue sharing eligibility",
      "Governance proposal rights",
    ],
    color: "rose",
  },
];

// Helper function to get tier from score
export function getTierFromScore(score: number): TierInfo {
  for (const tier of REWARD_TIERS) {
    if (score >= tier.minScore && score <= tier.maxScore) {
      return tier;
    }
  }
  return REWARD_TIERS[0]; // Default to Tier 1
}

export interface HealthResponse {
  status: string;
  timestamp: number;
  version: string;
  service: string;
}

// ============================================
// API Functions
// ============================================

/**
 * Check if the API server is healthy
 */
export async function checkHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error("API server is not responding");
  }
  return response.json();
}

/**
 * Scan blockchain activity for both Stellar and Polkadot addresses
 */
export async function scanReputation(
  stellarAddress: string,
  polkadotAddress: string
): Promise<ReputationData> {
  const response = await fetch(`${API_BASE_URL}/scan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      stellarAddress,
      polkadotAddress,
    } as ScanRequest),
  });

  const result: ScanResponse = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || "Failed to scan reputation");
  }

  if (!result.data) {
    throw new Error("No data returned from scan");
  }

  return result.data;
}

/**
 * Validate wallet addresses without performing a full scan
 */
export async function validateAddresses(
  stellarAddress?: string,
  polkadotAddress?: string
): Promise<{
  stellar: { provided: boolean; valid: boolean };
  polkadot: { provided: boolean; valid: boolean };
  canScan: boolean;
}> {
  const params = new URLSearchParams();
  if (stellarAddress) params.append("stellarAddress", stellarAddress);
  if (polkadotAddress) params.append("polkadotAddress", polkadotAddress);

  const response = await fetch(`${API_BASE_URL}/scan/validate?${params}`);
  const result = await response.json();

  return result.validation
    ? {
        stellar: result.validation.stellar,
        polkadot: result.validation.polkadot,
        canScan: result.canScan,
      }
    : {
        stellar: { provided: false, valid: false },
        polkadot: { provided: false, valid: false },
        canScan: false,
      };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get color for reputation score
 */
export function getScoreColor(score: number): string {
  if (score >= 800) return "text-emerald-600";
  if (score >= 600) return "text-green-600";
  if (score >= 400) return "text-yellow-600";
  if (score >= 200) return "text-orange-600";
  return "text-red-600";
}

/**
 * Get background color for reputation score
 */
export function getScoreBgColor(score: number): string {
  if (score >= 800) return "bg-emerald-500";
  if (score >= 600) return "bg-green-500";
  if (score >= 400) return "bg-yellow-500";
  if (score >= 200) return "bg-orange-500";
  return "bg-red-500";
}

/**
 * Get label for reputation score range
 */
export function getScoreLabel(score: number): string {
  if (score >= 800) return "Excellent";
  if (score >= 600) return "Good";
  if (score >= 400) return "Fair";
  if (score >= 200) return "Building";
  return "New";
}

/**
 * Format large numbers with K/M suffix
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(2);
}

/**
 * Get profile badge color
 */
export function getProfileColor(profile: ReputationProfile): string {
  const colors: Record<ReputationProfile, string> = {
    Trader: "bg-blue-100 text-blue-800",
    Governor: "bg-purple-100 text-purple-800",
    Staker: "bg-green-100 text-green-800",
    "Liquidity Provider": "bg-cyan-100 text-cyan-800",
    Balanced: "bg-amber-100 text-amber-800",
    Newcomer: "bg-gray-100 text-gray-800",
  };
  return colors[profile] || "bg-gray-100 text-gray-800";
}

export default {
  checkHealth,
  scanReputation,
  validateAddresses,
  getScoreColor,
  getScoreBgColor,
  getScoreLabel,
  formatNumber,
  getProfileColor,
};
