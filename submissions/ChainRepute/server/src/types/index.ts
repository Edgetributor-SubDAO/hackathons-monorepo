// ============================================
// Request/Response Types
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

// ============================================
// Reputation Data Types
// ============================================

export interface ReputationData {
  overallScore: number; // 0-1000
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

// ============================================
// Blockchain Activity Types
// ============================================

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
  // Raw metrics
  transactionCount: number;
  totalVolume: number; // In XLM
  liquidityProvided: number; // In XLM
  accountAge: number; // Days
  assetDiversity: number; // Number of unique assets
  paymentCount: number;
  uniqueRecipients: number; // NEW: Unique addresses interacted with
  oldestTransaction: string | null; // NEW: Date of oldest transaction
  // Score breakdown (5 params x 100 = 500 max)
  scoreBreakdown: ChainScoreBreakdown;
  score: number; // 0-500 (updated from 450)
}

export interface PolkadotActivity {
  address: string;
  // Raw metrics
  governanceVotes: number;
  stakingAmount: number; // In DOT
  stakingDuration: number; // Days
  validatorNominations: number;
  parachainInteractions: number;
  accountAge: number; // Days
  identityVerified: boolean;
  uniqueRecipients: number; // NEW: Unique addresses interacted with
  oldestTransaction: string | null; // NEW: Date of oldest transaction
  // Score breakdown (5 params x 100 = 500 max)
  scoreBreakdown: ChainScoreBreakdown;
  score: number; // 0-500 (updated from 550)
}

// ============================================
// Overall Score Breakdown (Legacy - for AI insights)
// ============================================

export interface ScoreBreakdown {
  transactionConsistency: number; // 0-200
  governanceParticipation: number; // 0-250
  stakingBehavior: number; // 0-200
  liquidityProvision: number; // 0-150
  accountAge: number; // 0-100
  assetDiversity: number; // 0-100
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

// ============================================
// AI Insights
// ============================================

export interface AIInsights {
  profile: ReputationProfile;
  confidence: number; // 0-100
  summary: string;
  strengths: string[];
  recommendations: string[];
  redFlags: string[];
}

// ============================================
// API Response Types from External Services
// ============================================

// Stellar Horizon API Response Types
export interface HorizonAccountResponse {
  id: string;
  account_id: string;
  sequence: string;
  balances: HorizonBalance[];
  signers: HorizonSigner[];
  data: Record<string, string>;
  last_modified_time: string;
}

export interface HorizonBalance {
  balance: string;
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
}

export interface HorizonSigner {
  key: string;
  type: string;
  weight: number;
}

export interface HorizonTransaction {
  id: string;
  successful: boolean;
  created_at: string;
  source_account: string;
  fee_charged: string;
  operation_count: number;
}

export interface HorizonPayment {
  id: string;
  type: string;
  created_at: string;
  from: string;
  to: string;
  amount: string;
  asset_type: string;
  asset_code?: string;
}

// Subscan API Response Types (for Polkadot)
export interface SubscanAccountInfo {
  address: string;
  balance: string;
  lock: string;
  reserved: string;
  nonce: number;
}

export interface SubscanTransfer {
  from: string;
  to: string;
  success: boolean;
  hash: string;
  block_num: number;
  block_timestamp: number;
  amount: string;
}

export interface SubscanStakingInfo {
  controller: string;
  stash: string;
  bonded: string;
  active: string;
  unlocking: Array<{
    value: string;
    era: number;
  }>;
}
